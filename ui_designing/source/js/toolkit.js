
var Geokit = function(callback) {
    this.status = undefined;
    this.result = false;
    return false;
}

Geokit.prototype.done = function(pos) {
this.status = "success";
console.log(this.status, this);
console.log("done:", pos, status);
this.result = pos;
}

Geokit.prototype.fail = function(a) {
	this.status = false;
	alert("airwncはGPS情報を必要とします。このメッセージが表示された場合、リロードして位置情報を許可して下さい。")
}

Geokit.prototype.get = function(callback,failedCallback) {
var $this = this;
navigator.geolocation.getCurrentPosition(
  function(pos) {
    $this.done(pos);
    if(!!callback) callback.call(this);
  },
  function(pos) {
    $this.fail(pos);console.log("failed");
   failedCallback.call(this);
  });
}

var geolocation = new Geokit();

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
		//console.log("トイレ詳細呼び出し:",id);
		window.location = '/toilet_detail.html';
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
			//console.log(toilets[i])
			$list.append(_tool.createToiletCell(toilets[i]));
		}
	},
	createToiletDetail : function(obj){
		var price = !!obj.price ? '<li><strong>Price</strong><span>&yen;'+_tool.separateComma(parseInt(obj.price))+'</span></li>' : "";
		var priceTag = !!obj.price ? '<div class="price">&yen;'+_tool.separateComma(parseInt(obj.price))+'</div>' : "";
		var star = _tool.createStar(obj.reviewOverview.rateAverage);
		var ratedCount = _tool.createCount(obj.reviewOverview.rateCount);
		var reviewCount = _tool.createCount(obj.reviewOverview.reviewCount);
		var vr = '<a href="#vr" class="vr-ready">VR Ready</a>';

		var gmap = '<iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d12974.857270082344!2d139.78311095!3d35.610113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sja!2sjp!4v1447481309156" width="100%" height="450" frameborder="0" style="border:0" allowfullscreen></iframe>'
		//var prewrite = '<a class="toilet" data-toilet-id="'+obj.id+'" ><div class="thumbnail"><img src="'+obj.thumbnail+'"></div>'+price+'<div class="detail"><div class="title">'+obj.name+'</div><div class="review-counts"><span class="star">'+star+'</span>'+ratedCount+' <i class="fa fa-comment"></i>'+reviewCount+'</div></div></a>';

		var reviews = (function(){
				var tmp = "";
				for(var i=0,il=obj.review.length;i<il;i++){
					if (!obj.review[i].comment) continue;
					tmp += '<li><div class="review"><div class="user"><div class="icon"><img src="/images/usericonsample.jpg" alt=""></div><div class="name">トイレマン</div></div><div class="detail"><p>'+obj.review[i].comment+'</p><div class="review-counts">'+_tool.createStar(obj.review[i].rate)+'</div></div></div></li>';
				}

				if(!!tmp){
					var result = '<div class="panel"><h3>REVIEW</h3><ul class="reviews">'+tmp+'</ul></div>';
				}else{
					var result = '<div class="panel"><h3>REVIEW</h3><p>THERE\'S NO REVIEW</p></div>';
				}

				return result;
			})(obj.review);


		var inside = '<div class="column">'+
						'<div class="col-full"><div class="panel"><header class="toilet"><h2>'+
						obj.name+
						'</h2><img src="'+obj.thumbnail+'" alt="" class="thumbnail"><div class="bg"><img src="#" alt="" style="background-image:url('+obj.thumbnail+')"></div>' +
						vr + priceTag + '</header><p class="main-descripion">'+obj.description+'</p><ul class="toilet-detail"><li><strong>Owner</strong><div>Yabu Kiyohide</div></li><li><strong>Location</strong><div>'+gmap+'</div></li><li><strong>Status</strong><span>Using</span></li>'+price+'</ul></div>'+
						'<div class="panel" id="offer-send-console"><a href="#" class="ui-btn ui-btn-positive ui-btn-block">SEND USE-OFFER</a><a href="#" class="ui-btn ui-btn-accept ui-btn-block">GO TO TOILET</a></div>'+
						reviews+'</div></div>'
		var $result = $("<section />").html(inside);

		$(".sections section").empty().append($result);

	},

	setUserDetail : function(obj){

		$("#user-details").html('<li><strong>Username</strong><span>'+obj.username+'</span></li>'+
			'<li><strong>Bio</strong><span>'+obj.description+'</span></li>'+
			'<li><strong>Email</strong><span>'+obj.email+'</span></li>'+
			'<li><strong>PhoneNumber</strong><span>'+obj.phone+'</span></li>');

	},
	switchPanicMode : function(){
		$("body").addClass("panic-mode");
		_tool.refreshGeolocation(function(){
			$("#panicmode-toilets").slideDown();
			$("#nearby-toilets").slideUp();
		});
	},
	refreshGeolocation : function(callback){
		$("#geolocating").fadeIn();
		geolocation.get(function(){
			if(!!callback) callback.call(this);
			$("#geolocating").fadeOut();
		})
	}
}


if(!!window.location.pathname.match("/home") && !!window.location.search.match("panic")){
	_tool.switchPanicMode();
}

$("#panic-button").on({"click":function(){
	if(!!window.location.pathname.match("/home")){
		_tool.switchPanicMode();
	}else{
		if(window.location.port == "5000"){
			window.location.href = "/home.html?panic"	
		}else{
			window.location.href = "/home?panic"
		}
		
	}
}})