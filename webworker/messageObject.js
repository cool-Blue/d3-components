function TransfSelection() {
    var buffer, selection, frameLength = 8,
        groups;
    function frame(d, i, j) {
        return [i, j, d.x, d.y, d.indx].concat(d.c);
    }
    function data(offset){
        var frame = buffer.subarray(offset, offset + frameLength);
        return {
            i: frame[0],
            j: frame[1],
            d: {
                x: frame[2], y: frame[3],
                indx: frame[4],
                c: [frame[5], frame[6], frame[7]]
            }
        }
    }
    function selectionBuffer(){
        var k = 0;
        buffer = new Float64Array(selection.size()*frameLength);
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
        for(k = 0; k < l; k += frameLength) {
            f = data(k);
            s[f.j][f.i] = {__data__: f.d};
        }
        return s
    }
    function dataBuffer(){
        var k = 0;
        buffer = new Float64Array(selection.length*frameLength);
        selection.forEach(function(d,i){
            var data = frame(d, i);
            buffer.set(data, k);
            k += data.length;
        });
    }
    function bufferData(){
        var l = buffer.length, frames = l/frameLength, i, j, k, f,
            d = new Array(frames);
        for(k = 0; k < l; k += frameLength) {
            f = data(k);
            d[f.i] = f.d;
        }
        return d
    }
    return {
        selectionBuffer: function(_){
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
            buffer = new Float64Array(_.buffer);
            groups = _.groups;
            frameLength = _.frame;
            return bufferSelection();
        },
        dataBuffer: function(_){
            if(!_) return buffer;
            selection = _;
            dataBuffer();
            return {
                buffer: buffer.buffer,
                frame: frameLength
            };
        },
        data: function(_){
            if(!_) return selection;
            buffer = new Float64Array(_.buffer);
            frameLength = _.frame;
            return bufferData();
        }
    }
}
