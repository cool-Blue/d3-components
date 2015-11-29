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
							return d? d[k[0]] + "_" + d[k[1]] + (k3 ?  "_" + d[k[1]] : "") : d;
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
	var squares = dataFrame.data(d.squares),
        changeSelection = d3.selection.prototype
            .data.call(dataFrame.selection(d.rects), squares, key()).exit(),
        rects;
    //console.log(d.rects.buffer.byteLength/d.rects.frame)
	changeSelection.each(function (d, i, j) {
		changeSelection[j][i].__data__ = squares[i]
	});
	self.postMessage({
		method: "changes",
		data: (rects = dataFrame.selectionBuffer(changeSelection))
	}, [rects.buffer]);

}
self.onmessage = function (e) {
	self[e.data.method](e.data)
};
