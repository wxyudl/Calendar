;(function(win){
	var __ = {};
	// 声明类
	// 例子： __.declare('Human', [], {
	//		eyes  : 2,
	//		hands : 2,
	//		feet  : 2,
	//		eat   : function(){
	//		
	//		}
	// });
	// 返回Human对象
	//
	// 例子： 继承Human对象 __.declare('Man', [Human], {
	//		sex: 'Male',
	//		eat: function(){
	//			// 吃饭
	//		}
	// });
	// 返回Human对象
	//
	__.declare = __.declare || function(namespace){
		if(this.type(namespace) !== '[object String]'){
			throw TypeError('类名只能是字符串');
		}
		
		var obj    = new Object();
		var proto  = obj.constructor.prototype;
		var hasOwn = Object.prototype.hasOwnProperty;
		
		if(arguments.length > 1){
			var mixins     = arguments[1];
			var properties = arguments[2];
			var i           = 1;
			if(this.type(mixins) !== '[object Array]'){
				throw TypeError('继承对象为数组');
			}
			
			if(this.type(properties) !== '[object Object]'){
				throw TypeError('属性参数只能是对象');
			}
			
			// 在原型中添加属性和方法
			for(prop in mixins[0]){
				if(hasOwn.call(mixins[0], prop)){
					proto[prop] = proto[prop] || mixins[0][prop];
				}
			}
				
			for(; i < mixins.length; i++){
				var mixin = mixins[i];
				if(__.type(mixin) !== '[object Object]'){
					throw TypeError('继承必须为对象数组');
				}
				
				this.declare(namespace, [mixins[i]], {});
			}
			
			// 添加自有属性及方法
			for(prop in properties){
				if(hasOwn.call(properties, prop)){
					obj[prop] = properties[prop];
				}
			}
		}
		
		this[namespace] = obj;
		return obj;
	};
	
	__.type = function(){
		return Object.prototype.toString.call(arguments[0]);
	};
	
	var date = __.declare('Date', [], {
		today: new Date(),
		currentMonth: function(){
			return this.today.getMonth() + 1;
		},
		currentYear: function(){
			return this.today.getFullYear();
		},
		isLeapYear: function(year){
			return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0); 
		},
		getDaysInMonth: function(month, year){
			 return [31, (this.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
		},
		getMonthName: function(month){
			return ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][month]
		},
		isSarursday: function(date){
			if(date.getDay() === 6){
				return true;
			}else{
				return false;
			}
		},
		isSunday: function(date){
			if(date.getDay() === 0){
				return true;
			}else{
				return false;
			}
		},
		isWeekend: function(date){
			if(this.isSatursday(date) && this.isSunday(date)){
				return true;
			}else{
				return false;
			}
		}
	});
	
	var http = __.declare('Http', [], {
		xhrGet: function(url, doneCallback, errorCallback){
			this.XHRConnection('GET', url, null, doneCallback, errorCallback);
		},
		
		xhrPost: function(url, data, doneCallback, errorCallback){
			this.XHRConnection('POST', url, data, doneCallback, errorCallback);
		},
	});
	
	http.XHRConnection = function XHRConnection(type, url, data, doneCallback, errorCallback){
		var _this = this;
		var xhr = new XMLHttpRequest();
		var contentType = 'application/x-www-form-urlencode';
		xhr.open(type, url || '', true);
		xhr.setRequestHeader('Content-Type', contentType);
		xhr.addEventListener( 'readystatechange', function(){
			var xhr = this;
			if(xhr.readyState === xhr.DONE){
				xhr.removeEventListener('readystatechange');
				if(xhr.status === 200 && xhr.status < 300){
					doneCallback(_this.parseResponse(xhr));
				}else{
					errorCallback(_this.parseResponse(xhr));
				}
			}
		}, false );
		xhr.send(this.objectToQueryString(data));
    };
	
	http.objectToQueryString = function(object){
		if(__.type(object) == '[object Object]'){
			return Object.keys(object).map(function(){
				return encodeURIComponent(item) + '=' + encodeURIComponent(object[item]);
			}).join('&');
		}else{
			return object;
		} 
	};
	
	http.parseResponse = function(xhr){
		var result;
		
		try{
			result = JSON.parse(xhr.responseText)
		}catch(e){
			result = xhr.responseText;
		}
		
		return result;
	};
	
	var dom = __.declare('Dom', [], {
		dom: {
			byId: function(id){
				return document.getElementById(id);
			},
			
			query: function(selector){
				return document.querySelectorAll(selector);
			},
			
			// 创建元素
			createE: function(tag, propObj){
				var e = document.createElement(tag);
				for(prop in propObj){
					e[prop] = propObj[prop];
				}
				
				return e;
			}
		}
	});
	
	// 声明实例对象
	var calendar = __.declare('Calendar', [date, http, dom], {
		dateEvents: [],
		country: 'China',
		
		URLs: {
			holidays: './holidays.json',
			customEvents: './customEvents.json'
		},
		
		// 初始化
		init: function(){
			
			this.renderHTML();
		},
		
		// 渲染HTML结构
		renderHTML: function(){
			var calendar = this.dom.byId('calendar');
			var currentYear = this.currentYear();
			var cHeader = this.dom.createE('div', {
				id: 'cHeader',
				innerHTML: '<div id="cHeader-Year"><a>'+ (currentYear - 1) +'</a> <a class="highlight">'+ currentYear +'</a> <a>'+ (currentYear + 1) +'</a></div><div id="cHeader-Month">'+ this.getMonthName(this.currentMonth()) +'</div>'
			});
			
			var cBody = this.dom.createE('div', {
				id: 'cBody',
				innerHTML: ''
			});
			
			calendar.appendChild(cHeader);
			calendar.appendChild(cBody);
			
			this.appendDate();
		},
		
		// 添加日期
		appendDate: function(){
			var currentYear = this.currentYear();
			var currentMonth = this.currentMonth();
			var days = this.getDaysInMonth(currentMonth, currentYear);
			var firstDayOfWeek = new Date(currentYear + '-' + currentMonth + '-1').getDay();
			var lasyDayIfWeek = new Date(currentYear + '-' + currentMonth + '-' + days).getDay();
			
			var preBlanks = firstDayOfWeek === 1 ? 0 : firstDayOfWeek;
			var leftBlanks = lasyDayIfWeek === 0 ? 0 : (7 - lasyDayIfWeek);
			var totalLine = (preBlanks + days + leftBlanks) / 7;
			var bodyHTML = '';
			var day = 1;
			
			for(l = 1; l <= totalLine; l++){
				bodyHTML += '<p>';
				for(c = 1; c <= 7; c++){
					if(c <= preBlanks && l == 1){
						bodyHTML += '<span>&nbsp;</span>';
					}else if(((7 - c) < leftBlanks) && l == totalLine){
						bodyHTML += '<span>&nbsp;</span>';
					}else{
						if(day === this.today.getDate()){
							bodyHTML += '<span class="highlight">'+ day +'</span>';
						}else if(c === 6 || c === 7){
							bodyHTML += '<span class="weekend-day">'+ day +'</span>';
						}else{
							bodyHTML += '<span data-day="'+ day +'">'+ day +'</span>';
						}
					}
					
					day++;
				}
				bodyHTML += '</p>';
				this.dom.byId('cBody').innerHTML = bodyHTML;
			}
			
			this.appendTodoToDate();
		},
		
		// 添加日期对应的TODO事件
		appendTodoToDate: function(){
			var _this = this;
			this.xhrGet(this.URLs.holidays, function(data){
				var holidays = data[_this.country];
				
				var d = 0;
				var availHolidayArr = [];
				for(; d < holidays.length; d++){
					var holidayArr = data[_this.country][d].split('#');
					var holiday = holidayArr[0];
					var holidayName = holidayArr[1];
					if(holiday.split('/')[0] == _this.currentMonth()){
						//availHolidayArr.push(holiday[d]);
						var holidayDayNode = _this.dom.query('span[data-day="'+ holiday.split('/')[1] +'"]')[0];
						holidayDayNode.setAttribute('class', 'holiday-day')
						holidayDayNode.appendChild(_this.dom.createE('em', {
							innerHTML: holidayName
						}));
					}
				}
			}, function(){
			});
			this.initEvents();
		},
		
		// 初始化鼠标、键盘等事件
		initEvents: function(){
			
		},
		
		destroy: function(){
			
			// 销毁日期事件
		}
	});
	
	calendar.init();
	win.__ = __;
})(window)