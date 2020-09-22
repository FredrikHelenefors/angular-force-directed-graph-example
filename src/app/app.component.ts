import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent2 implements OnInit {
  ngOnInit() {
    console.log('D3.js version:', d3['version']);

    this.loadForceDirectedGraph();
  }

  loadForceDirectedGraph() {
    let node;
    let link;
    let edgelabels;
    let edgepaths;
    const svg = d3.select('svg');
    const width = +svg.attr('width');
    const height = +svg.attr('height');
    const color = d3.scaleOrdinal(d3.schemeCategory20);

    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d) => d['id'])
      .distance(60).strength(1))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));

    d3.json('assets/miserables.json', (err, data) => {
      if (err) {
        throw new Error('Bad data file!');
      }

      link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data['links'])
        .enter()
        .append('line')
        .attr('stroke-width', (d) => Math.sqrt(d['value']));

      link.append('title')
        .text( (d) => {
          return d['value'];
        });

      const labelText = svg.selectAll('.labelText')
        .data(data['links'])
        .enter().append('text')
        .attr('class', 'labelText')
        .attr('dx', 20)
        .attr('dy', 0)
        .style('fill', 'red')
        .append('textPath')
        .attr('xlink:href', (i) => {
          return '#linkId_' + i;
        })
        .text((i) => {
          return 'text for link ' + i;
        });

      edgepaths = svg.selectAll('.edgepath')
        .data(data['links'])
        .enter()
        .append('path')
        .attr('class', 'edgepath')
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .attr('target', (i) => {
          return 'edgepath' + i;
        })
        .style('pointer-events', 'none');

      edgelabels = svg.selectAll('.edgelabel')
        .data(data['links'])
        .enter()
        .append('text')
        .style('pointer-events', 'none')

        .attr('class', 'edgelabel')
        .attr('label', (i) => {
          return 'edgelabel' + i;
        })
        .attr('font-size', 10)
        .attr('fill', '#aaa');

      edgelabels.append('textPath')
        .attr('xlink:href', function (d, i) {
          return '#edgepath' + i;
        })
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .attr('startOffset', '50%')
        .text(function (d) {
          return d['value'];
        });

      node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('rect')
        .data(data['nodes'])
        .enter()
        .append('rect')
        .attr('width', 25)
        .attr('height', 12)
        .attr('fill', (d) => color(d['group']))
        .call(d3.drag()
          .on('start', dragStarted)
          .on('drag', dragged)
          //.on('end', dragEnded)
        );


      node.append('text').text((d) => d['id']);

      node.append('title').text((d) => d['id']);

      node.append('text').text((d) => d['id'])
        .attr('dy', -9);

      simulation.nodes(data['nodes']).on('tick', ticked);

      simulation.force<d3.ForceLink<any, any>>('link').links(data['links']);

      function ticked() {
        link
          .attr('x1', function (d) {
            return d['source'].x;
          })
          .attr('y1', function (d) {
            return d['source'].y;
          })
          .attr('x2', function (d) {
            return d['target'].x;
          })
          .attr('y2', function (d) {
            return d['target'].y;
          });

        node.attr('cx', (d) => d['x'])
          .attr('cy', (d) => d['y'])
          .attr('x', (d) => d.x)
          .attr('y', (d) => d.y );
      }

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
    });

    function dragStarted(d) {
      if (!d3.event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragEnded(d) {
      if (!d3.event.active) {
        simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    }
  }
}
