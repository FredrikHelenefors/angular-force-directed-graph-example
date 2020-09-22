import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import * as d3 from 'd3';

// import * as data from "./eco.json";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  ngOnInit() {

    d3.json('assets/eco.json', (err, data) => {
      if (err) {
        throw new Error('Bad data file!');
      }
      this.update(data);
    });
  }

  update(data) {
    const nodeDescription = document.querySelector('.node-description');
    const colors = d3.scaleOrdinal(d3.schemeCategory10);
    const svg = d3.select('svg');
    let width = +svg.attr('width');
    let height = +svg.attr('height');
    let edgelabels;
    let edgepaths;
    const nodes = data['nodes'];
    const links = data['links'];
    let link;
    let node;

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 13)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 13)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none')
      .append('line')
      .attr('stroke-width', (d) => Math.sqrt(2));

    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d) => d['id'])
        .distance(150).strength(1))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));

    update(links, nodes);

    // tslint:disable-next-line:no-shadowed-variable
    function update(links, nodes) {

      width = +svg.attr('width');
      height = +svg.attr('height');
      const xCenter = width / 2;
      const yCenter = height / 2;

      svg.attr('width', width)
        .attr('height', height);

      simulation.force('center', d3.forceCenter(xCenter, yCenter));

      link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data['links'])
        .enter()
        .append('line')
        .attr('x1', 100)
        .attr('x2', 100)
        .attr('y1', 0)
        .attr('y2', 100)
        .attr('marker-end', 'url(#arrowhead)')
        .style('stroke', '#ccc')
        .style('pointer-events', 'none')
        .attr('stroke-width', (d) => Math.sqrt(d['value']));

      link.append('title')
        .text(function (d) {
          return d['type'];
        });

      edgepaths = svg.selectAll('.edgepath')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'edgepath')
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .attr('type', (i) => {
          return 'edgepath' + i;
        })
        .style('pointer-events', 'none');

      edgelabels = svg.selectAll('.edgelabel')
        .data(links)
        .enter()
        .append('text')
        .style('pointer-events', 'none')

        .attr('class', 'edgelabel')
        .attr('type', (i) => {
          return 'edgelabel' + i;
        })
        .attr('font-size', 10)
        .attr('fill', '#aaa');

      edgelabels.append('textPath')
        .attr('xlink:href', (d, i) => {
          return '#edgepath' + i;
        })
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .attr('startOffset', '50%')
        .text((d) => {
          return d['type'];
        });

      node = svg.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
        ).on('click', (d) => {
          nodeDescription.innerHTML = d['label'] + ': ' + d['timecarrier'];
        });

      node.append('rect')
        .attr('width', 120)
        .attr('height', 50)
        .attr('x', 0)
        .attr('y', -25)
        .attr('rx', 5)
        .attr('ry', 5)
        .style('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5)
        .style('stroke-dasharray', '')
        .style('opacity', 0.9)
        .style('cursor', 'pointer');

      node.append('title')
        .text((d) => {
          return d['label'];
        });

      node.append('text')
        .attr('x', 20)
        .attr('y', -10)
        .attr('dx', 12)
        .attr('dy', '.35em')
        .attr('font-size', 10)
        .attr('font-family', 'Roboto, sans-serif')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('pointer-events', 'none')
        .text((d) => {
          return d['label'];
        });

      simulation.nodes(nodes).on('tick', ticked);
      simulation.force<d3.ForceLink<any, any>>('link').links(links);
    }

    function ticked() {

      link.attr('x1', function (d) {
        return d.source.x;
      })
        .attr('y1', function (d) {
          return d.source.y;
        })
        .attr('x2', function (d) {
          return d.target.x;
        })
        .attr('y2', function (d) {
          return d.target.y;
        });

      node.attr('transform', (d) => 'translate(' + d.x + ', ' + d.y + ')');

      node.attr('x', (d) => d.x / 2)
        .attr('y', (d) => d.y / 2);

      edgepaths.attr('d', function (d) {
        return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
      });

      edgelabels.attr('transform', function (d) {
        if (d.target.x < d.source.x) {
          const bbox = this.getBBox();

          const rx = bbox.x + bbox.width / 2;
          const ry = bbox.y + bbox.height / 2;
          return 'rotate(180 ' + rx + ' ' + ry + ')';
        } else {
          return 'rotate(0)';
        }
      });
    }

    function dragstarted(d) {
      if (!d3.event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;

      d3.selectAll('.linkInGraph')
        .filter(li => {
          if (li['source'].id === d.id || li['target'].id === d.id) {
            return d;
          }
        })
        .attr('d', (d2) => {
          return moveLink(d2);
        });
    }

    svg.selectAll('linkInGraph')
      .data(links)
      .enter().append('path')
      .attr('class', 'linkInGraph')
      .attr('d', (d) => {
        return moveLink(d);
      })
      .style('stroke-width', 2).attr('stroke', 'blue')
      .attr('fill', 'none')
      .attr('marker-end', 'url(#pathMarkerHead)');

    function moveLink(l) {
      const nsid = nodes.find(n => n.id === l.source.id);
      const ndid = nodes.find(n => n.id === l.target.id);

      let min = Number.MAX_SAFE_INTEGER;
      let best;
      [[60, -25], [60, 25], [120, 0], [0, 0]].forEach(s =>
        [[60, -25], [60, 25], [120, 0], [0, 0]].forEach(d => {
          const dist = Math.hypot(
            (ndid.x + d[0]) - (nsid.x + s[0]),
            (ndid.y + d[1]) - (nsid.y + s[1])
          );
          if (dist < min) {
            min = dist;
            best = {
              s: {x: nsid.x + s[0], y: nsid.y + s[1]},
              d: {x: ndid.x + d[0], y: ndid.y + d[1]}
            };
          }
        })
      );

      const lineFunction = d3.line().x(d => {
        return d['x'];
      }).y(d => d['y']).curve(d3.curveLinear);

      return lineFunction([best.s, best.d]);
    }
  }
}
