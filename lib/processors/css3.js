/* 
    Processor: CSS3 Fixer 
*/
 (function() {
    var processor = function(css) {
        var enhanced = {};
        each(css,
        function(selector, properties) {
            each(properties,
            function(property, value) {
                var equivalents = processor.propMap[property]
                if (equivalents) {
                    if(!enhanced[selector]) enhanced[selector] = {};
                    each(equivalents,
                    function(i, equiv) {
                        if (typeof equiv == 'function') equiv(enhanced[selector], value)
                        else enhanced[selector][equiv] = value;
                    })
                }
            })
        });
        return enhanced;
    };
    extend(processor,{
        splitVal: function(value) {
            return each(value.split(' '),
            function(i, val) {
                return trim(val);
            })
        },
        propMap: {
            'box-sizing': ['-moz-box-sizing', '-webkit-box-sizing'],
            'border-radius': ['-moz-border-radius', '-webkit-border-radius'],
            'border-top-left-radius': ['-moz-border-radius-topleft', '-webkit-border-top-left-radius'],
            'border-top-right-radius': ['-moz-border-radius-topright', '-webkit-border-top-right-radius'],
            'border-bottom-right-radius': ['-moz-border-radius-bottomright', '-webkit-border-bottom-right-radius'],
            'transform': ['-moz-transform', '-webkit-transform', '-o-transform'],
            'transition': ['-moz-transition', '-webkit-transition', '-o-transition'],
            'column': ['-moz-column', '-webkit-column'],
            'column-count': ['-moz-column-count', '-webkit-column-count'],
            'column-gap': ['-moz-column-gap', '-webkit-column-gap'],
            'column-width': ['-moz-column-width', '-webkit-column-width'],
            'column-rule': ['-moz-column-rule', '-webkit-column-rule'],
            'column-rule-color': ['-moz-column-rule-color', '-webkit-column-rule-color'],
            'column-rule-style': ['-moz-column-rule-style', '-webkit-column-rule-style'],
            'column-rule-width': ['-moz-column-rule-width', '-webkit-column-rule-width'],
            'box-shadow': ['-moz-box-shadow', '-webkit-box-shadow',
            function IEDropShadow(selector, value) {
                var args = processor.splitVal(value);
                processor.addFilter(selector, 'progid:DXImageTransform.Microsoft.DropShadow(OffX=' + args[0] + ', OffY=' + args[1] + ', Color=\'' + args[3] + '\', Positive=\'1\')');
            }],
            'opacity': [function IEOpacity(selector, value) {
                var args = processor.splitVal(value);
                var ie = parseFloat(value * 100);
                processor.addFilter(selector, "alpha(opacity=" + ie + ")");
            }],
            'text-shadow': [function IETextShadow(selector, value) {
                var args = processor.splitVal(value),dir,x=parseFloat(args[0]),y=parseFloat(args[1]);
                if(x == 0 && y == 0) dir = null;
                if(x < 0 && y < 0) dir = 315;
                if(x < 0 && y > 0) dir = 225;
                if(x > 0 && y > 0) dir = 135;
                if(x > 0 && y < 0) dir = 45;
                if(x ==0 && y > 0) dir = 0;
                if(x ==0 && y < 0) dir = 180;                
                if(x > 0 && y == 0) dir = 90;
                if(x < 0 && y == 0) dir = 270;
                processor.addFilter(selector, 'progid:DXImageTransform.Microsoft.Shadow(Color=\''+args[3]+'\', Strength=\''+parseFloat(args[2])+'\', Direction=\''+dir+'\')')
            }]
        },
        addFilter: function(selector,filter) {
            if(!selector['filter']) selector['filter'] = '';
            if(!selector['-ms-filter']) selector['-ms-filter'] = '""';        
            filter+= ' ';
            selector['filter'] += filter;
            selector['-ms-filter'] = selector['-ms-filter'].replace(/\"$/,filter+'"')
        }
    });
    CSSParser.addProcessor('css3', processor);
})();
