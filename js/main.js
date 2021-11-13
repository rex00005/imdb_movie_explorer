const NULL_PLACEHOLDER = 'N/A';
const ATTR = {
  votes: 'votes',
  year: 'year',
  dollars: 'dollars',
  runtime: 'runtime',
  rating: 'rating',

  imdbVotes: 'imdbVotes',
  imdbRating: 'imdbRating',
  Year: 'Year',
  BoxOffice: 'BoxOffice',
  Genre: 'Genre',
  Runtime: 'Runtime',
};
const AXIS_OPTIONS = [
  {
    label: 'Released year',
    value: ATTR.year,
  },
  {
    label: 'Runtime',
    value: ATTR.runtime,
  },
  {
    label: "IMDb Rating",
    value: ATTR.rating,
  },
  {
    label: "IMDb Votes",
    value: ATTR.votes,
  },
  {
    label: 'Box Office',
    value: ATTR.dollars,
  },
];

let data = [];
let filter = {
  searchText: '',
  isOnlyShowAwards: false,
};
let xAxis = ATTR.year;
let yAxis = ATTR.votes;
let updateSvg = () => {};
let clickedMovie = null;

main();

async function main() {
  updateInfo();

  oriData.forEach((it) => {
    it[ATTR.year] = it[ATTR.Year] === NULL_PLACEHOLDER ? 0 : +it[ATTR.Year];
    it[ATTR.votes] =
      it[ATTR.imdbVotes] === NULL_PLACEHOLDER
        ? 0
        : +it[ATTR.imdbVotes].replace(',', '');
    it[ATTR.dollars] =
      it[ATTR.BoxOffice] === NULL_PLACEHOLDER
        ? 0
        : +it[ATTR.BoxOffice].replace(/,|\$/g, '') / 1000000;
    it[ATTR.runtime] =
      it[ATTR.Runtime] === NULL_PLACEHOLDER ? 0 : parseFloat(it[ATTR.Runtime]);
    it[ATTR.rating] =
      it[ATTR.imdbRating] === NULL_PLACEHOLDER
        ? 0
        : parseFloat(it[ATTR.imdbRating]);
  });

  console.log('votes', d3.extent(oriData.map((it) => it[ATTR.votes])));
  console.log('year', d3.extent(oriData.map((it) => it[ATTR.year])));
  console.log('dollar', d3.extent(oriData.map((it) => it[ATTR.dollars])));
  console.log('runtime', d3.extent(oriData.map((it) => it[ATTR.runtime])));

  setupFilter();
  setupAxis();
  updateSvg = setupSvg();
  drawPie();
}

async function setupFilter() {
  $('.votes-slider').slider({
    min: 0,
    max: 1000000,
    step: 1,
    range: true,
    values: [80, 500000],
    slide: function (event, ui) {
      updateSliderTip.call(this);
    },
    stop: function () {
      updateSliderTip.call(this);
      updateFilterData();
    },
    create: addSliderTip,
  });

  $('.year-slider').slider({
    min: 1960,
    max: 2021,
    step: 1,
    range: true,
    values: [1970, 2021],
    slide: function (event, ui) {
      updateSliderTip.call(this);
    },
    stop: function () {
      updateSliderTip.call(this);
      updateFilterData();
    },
    create: addSliderTip,
  });

  $('.dollars-slider').slider({
    min: 0,
    max: 800,
    step: 1,
    range: true,
    values: [0, 800],
    slide: function (event, ui) {
      updateSliderTip.call(this);
    },
    stop: function () {
      updateSliderTip.call(this);
      updateFilterData();
    },
    create: addSliderTip,
  });

  const genres = new Set();
  oriData.forEach((it) => {
    it[ATTR.Genre].split(', ').forEach((it2) => genres.add(it2));
  });
  genres.delete(NULL_PLACEHOLDER);
  const genresList = ['ALL', ...[...genres].sort()];
  genresList.forEach((it) => {
    $('.genre-select').append(`<option value="${it}">${it}</option>`);
  });
  $('.genre-select').on('change', updateFilterData);

  $('.search-input-box button').on('click', function () {
    filter.searchText = $('.search-input-box input')[0].value;
    updateData();
  });

  $('.checkbox-awards input').on('change', function () {
    updateFilterData();
  });

  updateFilterData();

  function addSliderTip() {
    const dom = $('<span />');
    dom.addClass('slider-tip');
    $(this).find('.ui-slider-handle').append(dom);
    updateSliderTip.call(this);
  }

  function updateSliderTip() {
    const low = $(this).slider('values', 0);
    const high = $(this).slider('values', 1);
    if (low != null) {
      $($(this).find('.slider-tip')[0]).text(low);
    }

    if (high != null) {
      $($(this).find('.slider-tip')[1]).text(high);
    }
  }
}

async function setupAxis() {
  d3.select('.x-axis-select')
    .selectAll('option')
    .data(AXIS_OPTIONS)
    .enter()
    .append('option')
    .text((d) => d.label)
    .attr('value', (d) => d.value);

  d3.select('.y-axis-select')
    .selectAll('option')
    .data(AXIS_OPTIONS)
    .enter()
    .append('option')
    .text((d) => d.label)
    .attr('value', (d) => d.value);

  d3.select('.x-axis-select').property('value', xAxis);
  d3.select('.y-axis-select').property('value', yAxis);

  $('.x-axis-select').on('change', (e) => {
    xAxis = e.target.value;
    updateSvg();
    // console.log('xAxis change', xAxis);
  });
  $('.y-axis-select').on('change', (e) => {
    yAxis = e.target.value;
    updateSvg();
    // console.log('yAxis change', yAxis);
  });
}

function updateFilterData() {
  filter.votes = {
    min: $('.votes-slider').slider('values', 0),
    max: $('.votes-slider').slider('values', 1),
  };

  filter.year = {
    min: $('.year-slider').slider('values', 0),
    max: $('.year-slider').slider('values', 1),
  };

  filter.dollars = {
    min: $('.dollars-slider').slider('values', 0),
    max: $('.dollars-slider').slider('values', 1),
  };

  filter.genre = $('.genre-select')[0].value;
  filter.isOnlyShowAwards = $('.checkbox-awards input')[0].checked;

  updateData();
}

function updateData() {
  const checkFilter = (item) => {
    return (
      filter.votes.min <= item[ATTR.votes] &&
      item[ATTR.votes] <= filter.votes.max &&
      filter.year.min <= item[ATTR.year] &&
      item[ATTR.year] <= filter.year.max &&
      filter.dollars.min <= item[ATTR.dollars] &&
      item[ATTR.dollars] <= filter.dollars.max &&
      (filter.genre === 'ALL' || filter.genre === item[ATTR.Genre]) &&
      (item['Title'].includes(filter.searchText) ||
        item['Director'].includes(filter.searchText) ||
        item['Actors'].includes(filter.searchText)) &&
      (!filter.isOnlyShowAwards || item['Awards'] !== NULL_PLACEHOLDER)
    );
  };

  data = oriData.filter((it) => checkFilter(it));

  console.log('data: ', data);
  updateSvg();
}

function setupSvg() {
  const margin = { top: 60, right: 30, bottom: 60, left: 100 },
    width = 700 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
  const tooltipDiv = d3.select('.tooltip');

  // append the svg object to the body of the page
  const svg = d3
    .select('.chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  const xAxisEle = svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0,' + height + ')');
  const yAxisEle = svg.append('g').attr('class', 'y-axis');
  const circleItemsGroupEle = svg.append('g');
  // Add X axis label:
  const xAxisLabel = svg
    .append('text')
    .attr('text-anchor', 'end')
    .attr('x', width)
    .attr('y', height + 40);

  // Add Y axis label:
  const yAxisLabel = svg
    .append('text')
    .attr('text-anchor', 'end')
    .attr('x', 0)
    .attr('y', -20)
    .attr('text-anchor', 'start');

  function updateSvg() {
    const x = createScale();
    xAxisEle.call(d3.axisBottom(x.axis));

    // Add Y axis
    var y = createScale(false);
    yAxisEle.call(d3.axisLeft(y.axis));

    xAxisLabel.text(AXIS_OPTIONS.find((it) => it.value === xAxis).label);
    yAxisLabel.text(AXIS_OPTIONS.find((it) => it.value === yAxis).label);

    // Add circle
    const updateSelection = circleItemsGroupEle
      .selectAll('.circle-item')
      .data(data)
      .attr('cx', function (d) {
        return x.axis(d[xAxis]);
      })
      .attr('cy', function (d) {
        return y.axis(d[yAxis]);
      });
    const enterSelection = updateSelection.enter();

    updateSelection.exit().remove();

    enterSelection
      .append('circle')
      .attr('class', 'circle-item')
      .attr('cx', function (d) {
        return x.axis(d[xAxis]);
        // return x.axis(x.domain[0]);
      })
      .attr('cy', function (d) {
        return y.axis(d[yAxis]);
      })
      .attr('r', 3)
      .on('click', function (d) {
        clickedMovie = d;
        updateInfo();
      })
      .on('mousemove', function (d) {
        d3.select(this).attr('r', 6);
        tooltipDiv.transition().duration(200).style('opacity', 0.9);
        tooltipDiv.select('.movie-name').text(d['Title']);
        tooltipDiv.select('.movie-year').text(d['Year']);
        tooltipDiv
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 3);
        tooltipDiv.transition().duration(500).style('opacity', 0);
      });
    
    // .attr('opacity', 0)
    //   .transition()
    //   .duration(2000)
    //   .attr('opacity', 1)
    //   .attr('cx', function (d) {
    //     return x.axis(d[xAxis]);
    //   });
  }

  function createScale(isX = true) {
    const dim = isX ? xAxis : yAxis;
    const dimData = data.map((it) => it[dim]);
    let domain = d3.extent(dimData);
    console.log('before domain', domain, dim);

    if (dim === ATTR.year) {
      if (domain[0] == null) {
        domain[0] = filter.year.min;
        domain[1] = filter.year.max;
      } else {
        domain[0] = domain[0] - 2;
        domain[1] = domain[1] + 2;
      }
    }

    if (dim === ATTR.votes) {
      if (domain[0] == null) {
        domain[0] = filter.votes.min;
        domain[1] = filter.votes.max;
      } else {
        domain[0] = Math.max(0, Math.floor((domain[0] - 1) / 100) * 100);
        domain[1] = Math.ceil((domain[1] + 1) / 100) * 100;
      }
    }

    if (dim === ATTR.rating) {
      domain = [0, 10];
    }

    if (dim === ATTR.runtime) {
      if (domain[0] == null) {
        domain[0] = 0;
        domain[1] = 300;
      } else {
        domain[0] = Math.max(0, Math.floor((domain[0] - 1) / 10) * 10);
        domain[1] = Math.ceil((domain[1] + 1) / 10) * 10;
      }
    }

    if (dim === ATTR.dollars) {
      if (domain[0] == null) {
        domain[0] = filter.dollars.min;
        domain[1] = filter.dollars.max;
      } else {
        domain[0] = Math.max(0, Math.floor((domain[0] - 1) / 10) * 10);
        domain[1] = Math.ceil((domain[1] + 1) / 10) * 10;
      }
    }

    console.log('domain', domain);

    if (isX) {
      return {
        axis: d3.scaleLinear().domain(domain).range([0, width]),
        domain,
      };
    } else {
      return {
        axis: d3.scaleLinear().domain(domain).range([height, 0]),
        domain,
      };
    }
  }

  updateSvg();

  return updateSvg;
}

function updateInfo() {
  if (!clickedMovie) {
    $('.no-data-info').css('display', 'block');
    $('.info-content').css('display', 'none');
  } else {
    $('.no-data-info').css('display', 'none');
    $('.info-content').css('display', 'block');

    $('.info-content h2').text(clickedMovie['Title']);
    $('.info-content a').attr(
      'href',
      `https://www.imdb.com/title/${clickedMovie['imdbID']}/`
    );
    $('.info-content img').attr('src', clickedMovie['Poster']);
    $('.info-rating').text(clickedMovie[ATTR.imdbRating]);
    $('.info-genre').text(clickedMovie['Genre']);
    $('.info-director').text(clickedMovie['Director']);
    $('.info-actors').text(clickedMovie['Actors']);
    $('.info-plot').text(clickedMovie['Plot']);
    $('.info-country').text(clickedMovie['Country']);
    $('.info-awards').text(clickedMovie['Awards']);
    $('.info-imdb-id').text(clickedMovie['imdbID']);
  }
}

function drawPie() {
  const tooltipDiv = d3.select('.pie-tooltip');

  // set the dimensions and margins of the graph
  const width = 300;
  height = 300;
  margin = 40;

  // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
  const radius = Math.min(width, height) / 2 - margin;

  // append the svg object to the div called 'my_dataviz'
  const svg = d3
    .select('.pie-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

  const genresMap = new Map();
  oriData.forEach((it) => {
    it[ATTR.Genre].split(', ').forEach((it2) => {
      genresMap.set(it2, (genresMap.get(it2) || 0) + 1);
    });
  });

  const data = [...genresMap.entries()].reduce((prev, [key, value]) => {
    prev[key] = value / oriData.length;
    return prev;
  }, {});
  console.log('pie data: ', data);

  // set the color scale
  const color = d3.scaleOrdinal().domain(data).range(d3.schemeSet2);

  // Compute the position of each group on the pie:
  const pie = d3.pie().value(function (d) {
    return d.value;
  });
  const dataReady = pie(d3.entries(data));
  // Now I know that group A goes from 0 degrees to x degrees and so on.

  // shape helper to build arcs:
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  svg
    .selectAll('mySlices')
    .data(dataReady)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', function (d) {
      return color(d.data.key);
    })
    .attr('stroke', 'black')
    .style('stroke-width', '2px')
    .style('opacity', 0.7)
    .on('mousemove', function (d) {
      console.log('data: ', d);
      tooltipDiv.transition().duration(200).style('opacity', 0.9);
      tooltipDiv.text(`${d.data.key}: ${d.data.value.toFixed(2)}`);
      tooltipDiv
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px');
    })
    .on('mouseout', function () {
      tooltipDiv.transition().duration(500).style('opacity', 0);
    });
}
