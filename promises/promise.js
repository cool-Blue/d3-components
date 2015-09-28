node.append('text')
	.attr('text-anchor', 'middle')
	.attr('dominant-baseline', 'central')
	.style('font-family','FontAwesome')
	.style('font-size','24px')
	.each(getIcon)
	.style('fill', function (d) {
		return color(d.group);
	});
function getIcon(d) {
	var myPromise = new Promise(function(resolve, reject){
		d3.json("data.json", function(error, glyphs){
			if(error || glyphs[d.char] === "undefined") reject('\uf233'); else resolve(glyphs[d.char]);
		})
	});
	myPromise.then(function(glyph) {
		d3.select(this).text(glyph)
	}).catch(function(defaultGlyph){
		d3.select(this).text(defaultGlyph)
	})
}