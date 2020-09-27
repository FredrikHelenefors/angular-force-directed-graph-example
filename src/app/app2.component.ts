import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import * as d3 from 'd3';

// import * as data from './eco.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  ngOnInit() {

    const nodes: Node[] = [];
    const links: Link[] = [];

    d3.json('assets/eco.json', (err, data) => {
      if (err) {
        throw new Error('Bad data file!');
      }
      data['nodes'].forEach(node => nodes.push(node));
      data['links'].forEach(link => links.push(link));
      this.update(nodes, links);
    });
  }

  update(nodes: Node[], links: Link[]) {
    const nodeDescription = document.querySelector('.node-description');
    const colors = d3.scaleOrdinal(d3.schemeCategory10);
    const svg = d3.select('svg');
    let width = +svg.attr('width');
    let height = +svg.attr('height');
    let edgelabels;
    let edgepaths;
    let link;
    let node;

    const lineData = [];
    let controlPointsArr = [];

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
      .force('link', d3.forceLink().id((d: Node) => {
        return d.id;
      })
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
        .data(links)
        .enter()
        .append('line')
        .attr('x1', 100)
        .attr('x2', 100)
        .attr('y1', 0)
        .attr('y2', 100)
        .attr('marker-end', 'url(#arrowhead)')
        .style('stroke', '#ccc')
        .style('pointer-events', 'none')
        .attr('stroke-width', (d: any) => Math.sqrt(d.value));

      link.append('title')
        .text(function (d: any) {
          return d.type;
        });

      edgepaths = svg.selectAll('.edgepath')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'edgepath')
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .attr('id', function (d, i: any) {
          return 'edgepath' + i;
        })
        .style('pointer-events', 'none');

      edgelabels = svg.selectAll('.edgelabel')
        .data(links)
        .enter()
        .append('text')
        .style('pointer-events', 'none')

        .attr('class', 'edgelabel')
        .attr('id', function(d, i: any) {
          console.log('EDGE PATH', i);
          return 'edgelabel' + i.target;
        })
        .attr('font-size', 10)
        .attr('fill', '#aaa');

      edgelabels.append('textPath')
        .attr('xlink:href', (d, i) => '#edgepath' + i)
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .attr('startOffset', '50%')
        .text((d) => d['type']);

      node = svg.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
        ).on('click', (d: Node) => {
          nodeDescription.innerHTML = d.label + ': ' + d.timecarrier;
        });

      node.append('rect')
        .attr('width', 120)
        .attr('height', 50)
        .attr('x', function (d: Node) {
          return 0;
        })
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
        .text((d: Node) => {
          return d.label;
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
        .text((d: Node) => {
          return d.label;
        });

      node.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('dx', 12)
        .attr('dy', '.35em')
        .attr('font-size', 6)
        .attr('font-family', 'Roboto, sans-serif')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('pointer-events', 'none')
        .text((d: Node) => {
          return 'TimeCarrier: ' + d.timecarrier;
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

      node.attr('transform', (d: Node) => 'translate(' + d.x + ', ' + d.y + ')');

      node.attr('x', (d: Node) => d.x / 2)
        .attr('y', (d: Node) => d.y / 2);

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
      if (l.source) {
        const nsid: Node = nodes.find(n => n.id === l.source.id);
        const ndid: Node = nodes.find(n => n.id === l.target.id);

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



      function linkSetupFuncn() {

        d3.selectAll('.links').remove();

        const edges = svg.selectAll('linksOnUi')
          .data(links)
          .enter()
          .insert('path', '.node')
          // tslint:disable-next-line:no-shadowed-variable
          .attr('class', 'linksOnUi').attr('id', function (l: Link) {
            return l.type;
          })
          // tslint:disable-next-line:no-shadowed-variable
          .attr('source', function(l) {
            return l.source;
          })
          // tslint:disable-next-line:no-shadowed-variable
          .attr('target', function(l) {
            return l.target;
          })
          .attr('marker-end', 'url(#arrowHeadMarker)')
          // tslint:disable-next-line:no-shadowed-variable
          .attr('d', function(l: any) {
            lineData.length = 0;
            controlPointsArr = [];
            const sourceNode = nodes.filter(function(d, i) {
              return d.id === l.source;
            })[0];
            const targetNode = nodes.filter(function(d, i) {
              return d.id === l.target;
            })[0];

            lineData.push({
              'a': sourceNode.x + 25,
              'b': sourceNode.y + 50
            });
            controlPointsArr.push(sourceNode.x + 25);
            controlPointsArr.push(sourceNode.y + 50);

            lineData.push({
              'a': targetNode.x + 25,
              'b': targetNode.y
            });
            controlPointsArr.push(targetNode.x + 25);
            controlPointsArr.push(targetNode.y);
            l.controlPoints = [];
            controlPointsArr.forEach(point => l.controlPoints.push(point));
            /*for (i = 0; i < controlPointsArr.length; i++) {
              l.controlPoints.push(controlPointsArr[i]);
            }*/
            return null; // lineFunction(lineData);

          }).style('stroke-width', '2').attr('stroke', 'blue').attr('fill', 'none');
      }

      /*const lineFunction = svg.append('path')
        .attr('d', svg.line()
          .y(function(d) { return d.y; })
          .curve(d3.curveLinear)(lineData));*/

      /*const lineFunction = svg.l
        .x(function(d) {
          return d.a;
        })
        .y(function(d) {
          return d.b;
        })
        .interpolate('linear');*/
    }
  }
}

export class Node {
  id: string;
  label: string;
  timecarrier: string;
  x: number;
  y: number;

  constructor(object: Record<string, any>) {
    this.id = object.id;
    this.label = object.label;
    this.timecarrier = object.timecarrier;
    this.x = 0;
    this.y = 0;
  }
}

export class Link {

  source: string;
  target: string;
  type: string;

  constructor(object: Record<string, any>) {
    this.source = object.source;
    this.target = object.target;
    this.type = object.type;
  }
}
