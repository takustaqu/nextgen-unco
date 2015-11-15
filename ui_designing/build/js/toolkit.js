
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
	geoDistance: function(lat1, lng1, lat2, lng2, precision) {
		// 引数　precision は小数点以下の桁数（距離の精度）
		var distance = 0;
		if ((Math.abs(lat1 - lat2) < 0.00001) && (Math.abs(lng1 - lng2) < 0.00001)) {
		distance = 0;
		} else {
		lat1 = lat1 * Math.PI / 180;
		lng1 = lng1 * Math.PI / 180;
		lat2 = lat2 * Math.PI / 180;
		lng2 = lng2 * Math.PI / 180;

		var A = 6378140;
		var B = 6356755;
		var F = (A - B) / A;

		var P1 = Math.atan((B / A) * Math.tan(lat1));
		var P2 = Math.atan((B / A) * Math.tan(lat2));

		var X = Math.acos(Math.sin(P1) * Math.sin(P2) + Math.cos(P1) * Math.cos(P2) * Math.cos(lng1 - lng2));
		var L = (F / 8) * ((Math.sin(X) - X) * Math.pow((Math.sin(P1) + Math.sin(P2)), 2) / Math.pow(Math.cos(X / 2), 2) - (Math.sin(X) - X) * Math.pow(Math.sin(P1) - Math.sin(P2), 2) / Math.pow(Math.sin(X), 2));

		distance = A * (X + L);
		var decimal_no = Math.pow(10, precision);
		distance = Math.round(decimal_no * distance / 1) / decimal_no;   // kmに変換するときは(1000で割る)
		}
		return distance;
	},
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
		window.location = '/toilet_detail.html?id='+id;
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
	createToiletPanicmodeCell:function(obj){
		var price = !!obj.price ? '<div class="price">&yen;'+_tool.separateComma(parseInt(obj.price))+'</div>' : "";
		var star = _tool.createStar(obj.reviewOverview.rateAverage);
		var ratedCount = _tool.createCount(obj.reviewOverview.rateCount);
		var reviewCount = _tool.createCount(obj.reviewOverview.reviewCount);
		
		var prewrite = '<div class="status"><span class="icon"><i class="fa fa-ellipsis-h"></i></span><span class="distance">'+obj.distance+'m</span></div><div class="detail"><div class="item"><div class="thumbnail"><img src="'+obj.thumbnail+'"></div><div class="price">¥900</div><div class="data"><div class="title">'+obj.name+'</div><div class="review-counts"><span class="star">'+star+'</span>'+ratedCount+' <i class="fa fa-comment"></i>'+reviewCount+'</div></div><div class="buttons"><a href="" class="ui-btn ui-btn-positive">Choose this one</a><a href="" class="ui-btn check-detail" data-toilet-id="'+obj.id+'" >Check details</a></div></div></div>'
		var $result = $("<li />").addClass('waiting toiletid-'+obj.id).html(prewrite).attr('data-toilet-id',obj.id);
			$result.find("a.check-detail").on({
				"click":function(){
					_tool.callToiletDetail($(this).attr("data-toilet-id"));
					return false;
				}
			})

		return $result;
	},

	setToiletList : function(toilets,selector,isPanicmode){
		var $list = $(selector);
		if(!$list.length) return false;


		//一旦空にします。
		$list.empty();

		//配列からガシガシばーんと生成。
		for(var i=0,il=toilets.length;i<il;i++){
			//console.log(toilets[i])
			if(!!isPanicmode){
				$list.append(_tool.createToiletPanicmodeCell(toilets[i]));
			}else{
				$list.append(_tool.createToiletCell(toilets[i]));	
			}
		}
	},
	createToiletDetail : function(obj){

		if(!!window.localStorage.getItem("airwnc") && !JSON.parse(window.localStorage.getItem("airwnc")).length){
			var cache = JSON.parse(window.localStorage.getItem("airwnc"));
		}else{
			var cache = {}
		}

		var price = !!obj.price ? '<li><strong>Price</strong><span>&yen;'+_tool.separateComma(parseInt(obj.price))+'</span></li>' : "";
		var priceTag = !!obj.price ? '<div class="price">&yen;'+_tool.separateComma(parseInt(obj.price))+'</div>' : "";
		var star = _tool.createStar(obj.reviewOverview.rateAverage);
		var ratedCount = _tool.createCount(obj.reviewOverview.rateCount);
		var reviewCount = _tool.createCount(obj.reviewOverview.reviewCount);
		var vr = '<a href="panorama.html" class="vr-ready">VR Ready</a>';

		var gmap = '<iframe src="http://maps.google.co.jp/maps?q=loc:'+obj.lat[0]+','+obj.lat[1]+'&iwloc=J&output=embed" width="100%" height="450" frameborder="0" style="border:0" allowfullscreen></iframe>'
		
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

		var additional = '<div class="panel pending" id="offer-send-console"><a href="#" class="ui-btn ui-btn-positive send-offer ui-btn-block">SEND USE-OFFER</a><a href="#" class="ui-btn ui-btn-accept send-im-go ui-btn-block">GO TO TOILET</a></div>'
		console.log(cache ,cache["id"+parseInt(obj.id)]);
		if(!!cache["id"+parseInt(obj.id)]){
			additional = '<div class="panel '+cache["id"+parseInt(obj.id)]+'" id="offer-send-console"><a href="#" class="ui-btn ui-btn-positive send-offer ui-btn-block">SEND USE-OFFER</a><a href="#" class="ui-btn ui-btn-accept send-im-go ui-btn-block">GO TO TOILET</a></div>'
			console.log(additional)
		}

		var inside = '<div class="column">'+
						'<div class="col-full"><div class="panel"><header class="toilet"><h2>'+
						obj.name+
						'</h2><img src="'+obj.thumbnail+'" alt="" class="thumbnail"><div class="bg"><img src="#" alt="" style="background-image:url('+obj.thumbnail+')"></div>' +
						vr + priceTag + '</header><p class="main-descripion">'+obj.description+'</p><ul class="toilet-detail"><li><strong>Owner</strong><div>Yabu Kiyohide</div></li><li><strong>Location</strong><div>'+gmap+'</div></li><li><strong>Status</strong><span>Using</span></li>'+price+'</ul></div>'+
						additional+reviews+'</div></div>';

		console.log(additional,reviews)

		

		
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

			$.ajax({
			    url: "http://api.airwn.co/api/get_toilets",
			    dataType: "JSON",
			    cache: false,
			    success: function(data, textStatus){

			    	window.localStorage.setItem("airwnc",JSON.stringify([]));

					$.each(data,function(){
						this.distance = _tool.geoDistance(geolocation.result.coords.latitude , geolocation.result.coords.longitude,this.lat[0],this.lat[1],2);
					})

					data.sort(function(a,b){
						if( a.distance < b.distance ) return -1;
						if( a.distance > b.distance ) return 1;
						return 0;
					});
					_tool.setToiletList(data,"#panicmode-toilets-list",true);
			    },
			    error: function(xhr, textStatus, errorThrown){
			    	console.log("failed",xhr, textStatus, errorThrown)
			      return false;
			    }
			  });
		});
	},
	refreshGeolocation : function(callback){
		$("#geolocating").fadeIn();
		geolocation.get(function(){
			if(!!callback) callback.call(this);
			$("#geolocating").fadeOut();
		})
	},
	setWelcomeMessage : function(){
		var client = new GStreetviewClient();
		_tool.refreshGeolocation(function(){
			$.ajax({
			    url: "http://api.airwn.co/api/get_user_detail?id=1",
			    dataType: "JSON",
			    cache: false,
			    success: function(data, textStatus){
					//この関数に引き渡したらばーん

					$("#welcome-message h1").text("Welcome,"+data.username+".");
					
					$("#open-userpage a").attr("href","/mypage.html?id="+data.id).html('<i class="fa fa-user"></i> '+data.username);
						var slatlng = 
						client.getNearestPanoramaLatLng(new GLatLng(geolocation.result.coords.latitude , geolocation.result.coords.longitude), setImage);
						function setImage(latlng){
						  $("#welcome-message .bg img").css("background-image",'url(https://maps.googleapis.com/maps/api/staticmap?center='+latlng.lat()+'%2C'+latlng.lng()+'&size=960x480&sensor=false&maptype=satellite&zoom=17&key=AIzaSyDoMyyhQn1cuBCpvNKOPFNtDrLmdEOpVjc)');
						}

					$("#welcome-message").removeClass("pending").addClass("ready");

			    },
			    error: function(xhr, textStatus, errorThrown){
			    	console.log("failed",xhr, textStatus, errorThrown)
			      return false;
			    }
			  });
			
		});
	},
	recieveMessage : function(targetId,status){

		if(!!window.localStorage.getItem("airwnc") && !JSON.parse(window.localStorage.getItem("airwnc")).length){
			var cache = JSON.parse(window.localStorage.getItem("airwnc"));
		}else{
			var cache = {}
		}
		
		
		$panicCell = $('#panicmode-toilets-list .toiletid-'+targetId);
		console.log($panicCell);
		$panicCell.removeClass("waiting ban allow").addClass(status).children(".detail").hide();
		cache["id"+parseInt(targetId)] = status;
		switch(status){
			case "allow":
				$panicCell.children(".detail").slideDown();
				$panicCell.children(".status").find("i").removeClass().addClass("fa fa-thumbs-up");
				break;
			case "ban":
				$panicCell.children(".detail").slideUp();
				$panicCell.children(".status").find("i").removeClass().addClass("fa fa-ban");
				break;
			case "waiting":
				$panicCell.children(".detail").slideUp();
				$panicCell.children(".status").find("i").removeClass().addClass("fa fa-ellipsis-h");
				break;
		}

		window.localStorage.setItem("airwnc",JSON.stringify(cache));
	},
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
