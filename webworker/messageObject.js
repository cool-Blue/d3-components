function TransfSelection() {
    var buffer, selection, frameLength = 8,
        groups;
    function frame(d, i, j) {
        var col = d3.rgb(d.c);
        return [i, j, d.x, d.y, d.indx].concat([col.r, col.g, col.b]);
    }
    function data(offset){
        var frame = buffer.subarray(offset, offset + frameLength);
        return {
            i: frame[0],
            j: frame[1],
            d: {
                x: frame[2], y: frame[3],
                indx: frame[4],
                c: "rgb(" + frame.subarray(5, 8).join(",") + ")"
            }
        }
    }
    function selectionBuffer(){
        var k = 0;
        buffer = new Int32Array(selection.size()*frameLength);
        selection.each(function(d,i,j){
            var data = frame(d, i, j);
            buffer.set(data, k);
            k += data.length;
        });
    }
    function bufferSelection(){
        var l = buffer.length, frames = l/frameLength, i, j, k, f,
            g = groups, s = new Array(g);
        for(i = 0; i < g; i++) s[i] = new Array(frames/g);
        for(k = 0; k < l; k += frames) {
            f = data(k);
            s[f.j][f.i] = f.d;
        }
        return s
    }
    return {
        buffer: function(_){
            if(!_) return buffer;
            selection = _;
            selectionBuffer();
            return {
                buffer: buffer.buffer,
                groups: selection.length,
                frame: frameLength
            };
        },
        selection: function(_){
            if(!_) return selection;
            buffer = new Int32Array(_.buffer);
            groups = _.groups;
            frameLength = _.frame;
            return bufferSelection();
        }
    }
}
