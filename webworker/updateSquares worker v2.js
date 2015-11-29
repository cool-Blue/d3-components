/// <reference path="d3/d3 CB.js" />
//	v2 modified to use indx plus one other property for key
var noop = function () {
	return new Function();
};

var window = noop();

window.CSSStyleDeclaration = noop();
window.CSSStyleDeclaration.setProperty = noop();

window.Element = noop();
window.Element.setAttribute = noop();
window.Element.setAttributeNS = noop();

window.navigator = noop();

var document = noop();

document.documentElement = noop();
document.documentElement.style = noop();
document.createElement = function () { return this };
document.style = {};
document.style.setProperty = noop();

importScripts('https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js');

var key = (function () {
			var keys, f, k0, kOther;
			return function key(d) {
                var k = d && d.data;
				if (k) {
					if (k.base) {
						keys = Object.keys(k.base);
						keys = k.include ? keys.filter(function (d, i, incl) {
							return incl.indexOf(d) != -1;
						})
						: k.exclude ? keys.filter(function (d, i, ex) {
							return ex.indexOf(d) === -1;
						}) : keys;
						k0 = keys[0]; kOther = keys.slice(1);
						f = function _key(d, i) {
							var dk0 = d[k0];
							return kOther
											.reduce(function r (k, p, i) {
												return k + "_" + d[p];
											}, dk0)
						}
					} else {
						var k3 = k.length === 3;
						f = function _key(d, i) {
							return d[k[0]] + "_" + d[k[1]] + (k3 ?  "_" + d[k[1]] : "");
						}
					}
					self.postMessage({ method: "key", data: true });
				} else {
					return f
				}
			}
		})();
importScripts("messageObject.js");
var dataFrame = TransfSelection()

function changes(d) {
	var squares = JSON.parse(d.squares),
			changeSelection = d3.selection.prototype
				.data.call(dataFrame.selection(d.rects), squares, key()).exit();
	changeSelection.each(function (d, i, j) {
		changeSelection[j][i].__data__ = squares[i]
	});
	self.postMessage({
		method: "changes",
		data: selectionToBuff(changeSelection)
	});

	function selectionFromBuff(selectionJSON) {
		return selectionJSON.map(function (g) {
			return JSON.parse(g).map(function (d) { return { __data__: d } });
		});
	}
    function selectionToBuff(selection) {
        return selection.map(function group(g) {
            return JSON.stringify(g.map(function node(d) {
                return d ? d.__data__ : undefined
            }));
        });
    }

}
self.onmessage = function (e) {
	self[e.data.method](e.data)
};
