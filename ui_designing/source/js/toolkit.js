
_tool = {
	separateComma : function(num){return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');},
	createStar : function(rate){
			if (typeof rate != "number") return ""; 
			var tmp = Math.floor( (rate*2 > 10) ? 10 : rate*2 );
			var n = '<i class="fa fa-star-o"></i>',
				h = '<i class="fa fa-star-half-o"></i>',
				f = '<i class="fa fa-star"></i>';
			switch(tmp){
				case 0: return n+n+n+n+n;
				case 1: return h+n+n+n+n;
				case 2: return f+n+n+n+n;
				case 3: return f+h+n+n+n;
				case 4: return f+f+n+n+n;
				case 5: return f+f+h+n+n;
				case 6: return f+f+f+n+n;
				case 7: return f+f+f+h+n;
				case 8: return f+f+f+f+n;
				case 9: return f+f+f+f+h;
				case 10: return f+f+f+f+f;
			}
		},

	createCount : function(rate){
			if (typeof rate != "number") return ""; 
			return '<span class="count">'+Math.floor(rate)+'</span>';
		},
	callToiletDetail: function(id,opt){
		console.log("トイレ詳細呼び出し:",id);
	},
	createToiletCell:function(obj){
		var price = !!obj.price ? '<div class="price">&yen;'+_tool.separateComma(parseInt(obj.price))+'</div>' : "";
		var star = _tool.createStar(obj.reviewOverview.rateAverage);
		var ratedCount = _tool.createCount(obj.reviewOverview.rateCount);
		var reviewCount = _tool.createCount(obj.reviewOverview.reviewCount);
		var prewrite = '<a class="toilet" data-toilet-id="'+obj.id+'" ><div class="thumbnail"><img src="'+obj.thumbnail+'"></div>'+price+'<div class="detail"><div class="title">'+obj.name+'</div><div class="review-counts"><span class="star">'+star+'</span>'+ratedCount+' <i class="fa fa-comment"></i>'+reviewCount+'</div></div></a>';

		var $result = $("<li />").html(prewrite);
			$result.children("a").on({
				"click":function(){
					_tool.callToiletDetail($(this).attr("data-toilet-id"));
					return false;
				}
			})

		return $result;
	},
	setToiletList : function(toilets,selector){
		var $list = $(selector);
		if(!$list.length) return false;


		//一旦空にします。
		$list.empty();

		//配列からガシガシばーんと生成。
		for(var i=0,il=toilets.length;i<il;i++){
			console.log(toilets[i])
			$list.append(_tool.createToiletCell(toilets[i]));
		}
	}
}