//	added limit function to keep squares in play
//	changed lock management to d3.map on __data__
//	delegated data bind to web worker
//	data transfer via JSON serialisation
//	lock moved off __data__ onto ___locks 
//		putting it on __data__ is not thread safe because transitions terminate 
//		during the worker cycle

$(function () {
	var container,
        svg, rects,
        gridHeight = 800,
        gridWidth = 1600,
        gridExtent, squaresExtent,
        cellSize, cellPitch,
        cellsColumns = 100,
        cellsRows = 50,
        cellsCount = cellsColumns * cellsRows,
        squares = [],
        inputs = d3.select("body").insert("div", '.svg-container')
            .attr("id", "metrics"),
        elapsedTime = outputs.ElapsedTime("#metrics", {
            border: 0, margin: 0, "box-sizing": "border-box",
            padding: "0 0 0 6px", background: "#2B303B", "color": "orange"
        }),
        hist = d3.ui.FpsMeter("#metrics", {display: "inline-block"}, {
            height: 10, width: 100,
            values: function(d){return 1/d},
            domain: [0, 60]
        }),
        container = d3.select('.svg-container'),
        svg = container.append('svg')
            .attr('width', gridWidth)
            .attr('height', gridHeight)
            .style({ 'background-color': 'black', opacity: 1 }),

        createRandomRGB = function () {
            var red = Math.floor((Math.random() * 256)).toString(),
                    green = Math.floor((Math.random() * 256)).toString(),
                    blue = Math.floor((Math.random() * 256)).toString(),
                    rgb = 'rgb(' + red + ',' + green + ',' + blue + ')';
            return rgb;
        },

        createGrid = function (width, height) {

            var scaleHorizontal = d3.scale.ordinal()
                        .domain(d3.range(cellsColumns))
                        .rangeBands([0, width], 1 / 15),
                    rangeHorizontal = scaleHorizontal.range(),

                    scaleVertical = d3.scale.ordinal()
                        .domain(d3.range(cellsRows))
                        .rangeBands([0, height]),
                    rangeVertical = scaleVertical.range(),

                    squares = [];
            rangeHorizontal.forEach(function (dh, i) {
                rangeVertical.forEach(function (dv, j) {
                    var indx;
                    squares[indx = i + j * cellsColumns] = { x: dh, y: dv, c: createRandomRGB(), indx: indx }
                })
            });

            cellSize = scaleHorizontal.rangeBand();
            cellPitch = {
                x: rangeHorizontal[1] - rangeHorizontal[0],
                y: rangeVertical[1] - rangeVertical[0]
            };
            gridExtent = {
                x: scaleHorizontal.rangeExtent(),
                y: scaleVertical.rangeExtent()
            };
            squaresExtent = {
                x: [gridExtent.x[0], gridExtent.x[1] - cellPitch.x],
                y: [gridExtent.y[0], gridExtent.y[1] - cellPitch.y]
            }

            rects = svg.selectAll("rect")
                .data(squares, function (d, i) { return d.indx })
                    .enter().append('rect')
                        .attr('class', 'cell')
                        .attr('width', cellSize)
                        .attr('height', cellSize)
                        .attr('x', function (d) { return d.x })
                        .attr('y', function (d) { return d.y })
                        .style('fill', function (d) { return d.c });

            return squares;
        },

        choseRandom = function (options) {
            options = options || [true, false];
            var max = options.length;
            return options[Math.floor(Math.random() * (max))];
        },

        pickRandomCell = function (selection, group) {
            //cells is a group from a selection, i.e. the second dimension of the array
            //it may be filtered so use a global cell count as a basis for computing size
            var l = cellsCount - locked.count,
                    r = Math.floor(Math.random() * l);
            return l ? d3.select(selection[group][r]).datum().indx : -1;
        },

        locked = (function () {
            var lockedNodeCount = 0;
            function l(name, value) {
                //<this> is a DOM element
                //can be called with name as an object to manage multiple locks
                if (typeof name === "string") {
                    if (value) {
                        if (!this.___locks) { this.___locks = d3.map(); lockedNodeCount++; }
                        this.___locks.set(name, value);
                    } else {
                        this.___locks.remove(name);
                        if (this.___locks.empty()) { delete this.___locks; lockedNodeCount--; }
                    }
                } else {
                    //name is an object, recurse multiple locks
                    for (var p in name) locked(p, name[p]);
                }
            };
            Object.defineProperty(l, "count", { get: function () { return lockedNodeCount; } })
            return l;
        })();
	function lock(lockClass) {
		//<this> is the node
		locked.call(this, lockClass, true)
	};
	function unlock(lockClass) {
		//<this> is the node
		locked.call(this, lockClass, false)
	};

	function permutateColours(cells, group, squares) {
		var samples = Math.min(10, Math.max(~~(squares.length / 5), 1)), s, ii = [], i, k = 0;
		while (samples--) {
			do i = pickRandomCell(cells, group); while (ii.indexOf(i) > -1 && k++ < 5 && i > -1);
			if (k < 10 && i > -1) {
				ii.push(i);
				s = squares[i];
				squares.splice(i, 1, { x: s.x, y: s.y, c: createRandomRGB(), indx: s.indx });
			}
		}
	}
	function permutatePositions(cells, group, squares) {
		var samples = Math.min(10, Math.max(~~(squares.length / 10), 1)), s, ss = [], d, m, p, k = 0;
		while (samples--) {
			do s = pickRandomCell(cells, group); while (ss.indexOf(s) > -1 && k++ < 5 && s > -1);
			if (k < 10 && s > -1) {
				ss.push(s);
				d = squares[s];
				m = { x: d.x, y: d.y, c: d.c, indx: d.indx };
				m[p = choseRandom(["x", "y"])] = limit(m[p] + choseRandom([-1, 1]) * cellPitch[p], squaresExtent[p]);
				squares.splice(s, 1, m);
			}
		}
		function limit (value, extent) {
			var min = extent[0], max = extent[1];
			return Math.min(max, Math.max(value, min))
		}
	}

	function getChanges(rects, squares) {
		//use a composite key function to use the exit selection as an attribute update selection
		//since its the exit selection, d3 does not bind the new data, this is done with the .each
		return rects
			.data(squares, function (d, i) { return d.indx + "_" + d.x + "_" + d.y + "_" + d.c; })
			.exit().each(function (d, i, j) { d3.select(this).datum(squares[i]) })
	}
	function updateSquaresXY(changes) {

		changes
			.transition("strokex").duration(600)
				.attr("stroke", "white")
				.style("stroke-opacity", 0.6)
			.transition("x").duration(1500)
				.attr('x', function (d) { return d.x })
				.each("start", function (d) { lock.call(this, "lockedX") })
				.each("end", function (d) { unlock.call(this, "lockedX") })
				.transition("strokex").duration(600)
					.style("stroke-opacity", 0)

		changes
				.transition("y").duration(1500)
					.attr('y', function (d) { return d.y })
					.each("start", function (d) { lock.call(this, "lockedY") })
					.each("end", function (d) { unlock.call(this, "lockedY") })
					.transition("strokey").duration(600)
						.style("stroke-opacity", 0)
	}

	function updateSquaresX(changes) {
		changes
			.transition("strokex").duration(600)
			.filter(function () { return !this.___locks })
				.attr("stroke", "white")
				.style("stroke-opacity", 0.6)
			.transition("x").duration(1500)
				.attr('x', function (d) { return d.x })
				.each("start", function (d) { lock.call(this, "lockedX") })
				.each("end", function (d) { unlock.call(this, "lockedX") })
				.transition("strokex").duration(600)
					.style("stroke-opacity", 0)
	}
	function updateSquaresY(changes) {
		changes
			.transition("strokey").duration(600)
			.filter(function () { return !this.___locks })
					.attr("stroke", "white")
					.style("stroke-opacity", 0.6)
				.transition("y").duration(1500)
					.attr('y', function (d) { return d.y })
					.each("start", function (d) { lock.call(this, "lockedY") })
					.each("end", function (d) { unlock.call(this, "lockedY") })
					.transition("strokey").duration(600)
						.style("stroke-opacity", 0)
	}
	function updateSquaresFill(changes) {

		changes.style("opacity", 0.6).transition("flash").duration(250).style("opacity", 1)
			.transition("fill").duration(800)
			.style('fill', function (d, i) { return d.c })
			.each("start", function (d) { lock.call(this, "lockedFill") })
			.each("end", function (d) { unlock.call(this, "lockedFill") });
	}

	squares = createGrid(gridWidth, gridHeight);
	
	var changes, exmpleKeyDescr = { base: squares[0], include: ["indx", "x", "y"] },
			rebindX = RebindWorker(["indx", "x"],
                function x(changes) {
                    updateSquaresX(changes);
                }),
			rebindY = RebindWorker(["indx", "y"],
                function y(changes) {
                    updateSquaresY(changes);
                }),
			rebindFill = RebindWorker(["indx", "c"],
                function fill(changes) {
                    updateSquaresFill(changes);
                });

	$.when(rebindX.done, rebindY.done, rebindFill.done).done(function () {
		squares_tick(squares)
	});

	function squares_tick(squares) {

		d3.timer(function t () {
			var dormantRects = rects.filter(function (d, i) { return !this.___locks }),
					_changes,
					rectsJSON = {data: null, serialised: true};

			permutateColours(dormantRects,0, squares);
			rectsJSON.data = rebindFill.postChanges(rects, squares).rectsJSON;

			permutatePositions(dormantRects,0, squares);
			rebindX.postChanges(rectsJSON, squares);
			rebindY.postChanges(rectsJSON, squares);

			$.when(rebindX.done, rebindY.done, rebindFill.done).done(function () {
				squares_tick(squares)
			});

			return true

			updateSquaresXY(_changes = getChanges(rects, squares));
		});
	};

	function RebindWorker(keyDescriptor, updateThen) {
		//dependency jquery Deferred
		var rebind = new Worker("updateSquares worker v2.js");
		//custom methods
		rebind.changes = function (data) {
			var args;
			changes = selectionFromBuff(data);
			//the message serialisation process truncates trailing null array entries
			//re-establish these by adjusting the length of each group in the selection
			rects.forEach(function restoreLength(d, i) { changes[i].length = d.length });

			//re-bind the d3 selection behaviour to the returned object
			Object.keys(d3.selection.prototype).forEach(function (p, i, o) {
				changes[p] = d3.selection.prototype[p]
			});
			//put the new data on the changed nodes
			changes.each(function reData(d, i, j) {
				d3.select(rects[j][i]).datum(d);
			});

			//put the dom elements on the newly created changes selection
			changes.each(function reNode(d, i, j) {
				changes[j][i] = rects[j][i];
			});

			updateThen(changes);
			this.done.resolve(changes);
			this.done = $.Deferred();
		};
		rebind.postChanges = function (rects, squares) {
			var rectsJSON = rects.serialised ? rects.data : selectionToBuff(rects),
					squaresJSON = squares.serialised ? squares.data : JSON.stringify(squares),
					data = { rectsJSON: rectsJSON, squaresJSON: squaresJSON };
			rebind.postMessage({
				method: "changes",
				data: data,
			});
			return data
		};
		rebind.key = function (data) {
			this.done.resolve(data);
			this.done = $.Deferred();
		};
		rebind.done = $.Deferred();
		//standard methods
		rebind.postMessage({
			method: "key",
			data: keyDescriptor,
		});
		rebind.onmessage = function (e) {
			//invoke the method on the data
			this[e.data.method](e.data.data);
		};

		return rebind;

		function selectionToBuff(selection) {
			return selection.map(function group(g) {
				return JSON.stringify(g.map(function node(d) { return d.__data__ }));
			});
		};
        function selectionFromBuff(selectionJSON) {
            return selectionJSON.map(function (g) {
                return JSON.parse(g).map(function (d) {
                    return d ? { __data__: d } : undefined
                });
            });
        };
	};
	elapsedTime.message(function (value) {
		var this_lap = this.lap().lastLap, aveLap = this.aveLap(this_lap);
		return 'frame rate: ' + d3.format(" >7,.1f")(1/aveLap)
	});
	elapsedTime.start(1000);
	d3.timer(function () {
		elapsedTime.mark();
        if(elapsedTime.aveLap.history.length)
            hist(elapsedTime.aveLap.history);
	})
});