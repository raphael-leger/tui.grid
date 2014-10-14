    /**
     * 크기 관련 데이터 저장
     * @type {*|void}
     */
    Model.Dimension = Model.Base.extend({
        models : null,
        columnModel : null,
        defaults : {
            width : 0,

            headerHeight : 0,
            bodyHeight : 0,

            rowHeight : 0,

            rsideWidth : 0,
            lsideWidth : 0,
            columnWidthList : []
        },
        initialize : function(attributes){
            Model.Base.prototype.initialize.apply(this, arguments);
            this.columnModel = this.grid.columnModel;
            this.listenTo(this.columnModel , "change", this._onWidthChange);
            this.on("change:width", this._onWidthChange, this);
            this._setColumnWidth();
            this._setBodyHeight();
            this._setHeaderHeight();

            this.setOwnProperties({
                timeoutIdForResize : 0
            });
            $(window).on('resize', $.proxy(this._onWindowResize, this));
        },
        _onWindowResize : function(resizeEvent){
            clearTimeout(this.timeoutIdForResize);
            this.timeoutIdForResize = setTimeout($.proxy(function(){
                var width = Math.max(this.grid.option('minimumWidth'), this.grid.$el.css('width', '100%').width());
                this.set('width', width);
            }, this), 100);
        },
        /**
         * _onWidthChange
         *
         * width 값 변경시 각 column 별 너비를 계산하는 로직
         * @param model
         * @private
         */
        _onWidthChange : function(model){
            var curColumnWidthList = this.get('columnWidthList');
            this._setColumnWidth(this._calculateColumnWidthList(curColumnWidthList));
        },
        _setBodyHeight : function(){
//            var height = (this.get('rowHeight') + 1) * this.grid.option('displayRowCount') - 2;
            var height = Util.getTBodyHeight(this.grid.option('displayRowCount'), this.get('rowHeight'));
            //TODO scroll height 예외처리
            height += this.grid.scrollBarSize;
            this.set('bodyHeight', height);
        },
        getDisplayRowCount : function(){
//            Math.ceil(this.get('bodyHeight') / this.get('rowHeight'));
            return Util.getDisplayRowCount(this.get('bodyHeight'), this.get('rowHeight'));
        },
        _setHeaderHeight : function(){
            //@todo calculate header height
            var height = this.grid.option('headerHeight');
            this.set('headerHeight', height);
        },

        _setColumnWidth : function(columnWidthList){
            var rsideWidth, lsideWidth = 0,
                columnWidthList = columnWidthList || this._getOriginalWidthList(),
                totalWidth = this.get("width"),
                columnFixIndex = this.columnModel.get("columnFixIndex");
            for(var i = 0, len=columnWidthList.length; i < len; i++){
                if(i < columnFixIndex){
                    lsideWidth += columnWidthList[i]+1;
                }
            }
            lsideWidth += 1;
            rsideWidth = totalWidth - lsideWidth;
            this.set({
                rsideWidth : rsideWidth,
                lsideWidth : lsideWidth,
                columnWidthList : columnWidthList
            });
            this.trigger('columnWidthChanged');
        },

        setColumnWidth : function(index, width){
            width = Math.max(width, this.grid.option('minimumColumnWidth'));

            var curColumnWidthList = this.get('columnWidthList');
            curColumnWidthList[index] = width;
            var calculatedColumnWidthList = this._calculateColumnWidthList(curColumnWidthList);



            this._setColumnWidth(calculatedColumnWidthList);
        },



        getColumnWidthList : function(whichSide){
            whichSide = (whichSide) ? whichSide.toUpperCase() : undefined;
            var columnFixIndex = this.columnModel.get("columnFixIndex");
            var columnList = [];

            switch(whichSide){
                case 'L':
                    columnList = this.get('columnWidthList').slice(0, columnFixIndex);
                    break;
                case 'R':
                    columnList = this.get('columnWidthList').slice(columnFixIndex);
                    break;
                default :
                    columnList = this.get('columnWidthList')
                    break;
            }
            return columnList;
        },
        /**
         * columnModel 에 설정된 width 값을 기준으로 widthList 를 작성한다.
         *
         * @returns {*}
         * @private
         */
        _getOriginalWidthList : function(){
            var columnModelList = this.columnModel.get("visibleList"),
                columnWidthList = [];
            for(var i = 0, len=columnModelList.length; i < len; i++){
                if(columnModelList[i].width){
                    columnWidthList.push(columnModelList[i].width);
                }else{
                    columnWidthList.push(-1);
                }
            }

            return this._calculateColumnWidthList(columnWidthList);
        },


        /**
         * 인자로 columnWidthList 배열을 받아 현재 total width 에 맞게 계산한다.
         *
         * @param columnWidthList
         * @returns {Array}
         * @private
         */
        _calculateColumnWidthList : function(columnWidthList){
            var remainWidth, unassignedWidth, remainDividedWidth,
                newColumnWidthList = [],
                totalWidth = this.get("width"),
                width = 0,
                currentWidth = 0,
                unassignedCount = 0;

            for(var i = 0, len=columnWidthList.length; i < len; i++){
                if(columnWidthList[i] > 0){
                    width = Math.max(this.grid.option('minimumColumnWidth'), columnWidthList[i]);
                    newColumnWidthList.push(width);
                    currentWidth += width;
                }else{
                    newColumnWidthList.push(-1);
                    unassignedCount++;
                }
            }

            remainWidth = totalWidth - currentWidth;


            if(totalWidth > currentWidth && unassignedCount === 0){
//                remainDividedWidth = Math.floor(remainWidth / newColumnWidthList.length);
//                for(var i = 0, len=newColumnWidthList.length; i < len; i++){
//                    newColumnWidthList[i] += remainDividedWidth;
//                    if(i === len-1){
//                        newColumnWidthList[i] += (remainWidth - (remainDividedWidth * len));
//                    }
//                }
                newColumnWidthList[newColumnWidthList.length-1] += remainWidth;
            }

            if(totalWidth > currentWidth){
                remainWidth = totalWidth - currentWidth;
                unassignedWidth = Math.max(this.grid.option('minimumColumnWidth'), Math.floor(remainWidth / unassignedCount));
            }else{
                unassignedWidth = this.grid.option('minimumColumnWidth');
            }

            for(var i = 0, len=newColumnWidthList.length; i < len; i++){
                if(newColumnWidthList[i] === -1){
                    newColumnWidthList[i] = unassignedWidth;
                }
            }

            return newColumnWidthList;
        }
    });