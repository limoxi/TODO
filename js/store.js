/**
*	封装localStorage
*
*/

;(function (AS, storage, undefined){
	if(!storage){
		alert('此浏览器不支持本地存储！！');
		return;
	}
	if(!AS || !AS.sync){
		console.error('store.js依赖AS.js和sync.js');
		return;
	}
	if(storage.getItem('todoReady') !== 'true') {
		storage.clear();
		storage.setItem('todoReady', true);
	}

	AS.notify = AS.noop;
	AS.TODO_DATA = 'todoData';
	AS.DONE_DATA = 'finishedData';
	AS.TID2TASK = {};
	AS.TID_ARRAY = [];
	AS.settings = {
		timerFrequency: parseInt(storage.getItem('timer') || 20),
		colorfulStatus: JSON.parse(storage.getItem('observer') || '{}')
	};
	var timer;
	AS.store = {
		setTimerFrequency: function(min){
			AS.settings.timerFrequency = min;
			storage.setItem('timer', min);
			AS.store.startTimer();
		},
		setColorfulStatus: function(min, color){
			AS.settings.colorfulStatus[min] = color;
			storage.setItem('observer', JSON.stringify(AS.settings.colorfulStatus));
		},
		get: function(mode){
			var str = storage.getItem(mode);
			if(!str) return {};
			return JSON.parse(str);
		},
		add: function(options){
			var newTask = new Task(options);
			AS.TID_ARRAY.push(newTask.tid);
		},
		set: function(mode, tid, data){
			var modeData = AS.store.get(mode);
			modeData[tid] = data;
			storage.setItem(mode, JSON.stringify(modeData));
		},
		remove: function(mode, tid){
			var todoData = AS.store.get(AS.TODO_DATA);
			var returnData = todoData[tid];
			delete todoData[tid];
			storage.setItem(mode, JSON.stringify(todoData));
			AS.TID_ARRAY.pop(tid);
			return returnData
		},
		finish: function(tid){
			var finishedData = AS.store.remove(AS.TODO_DATA, tid);
			AS.store.set(AS.DONE_DATA, tid, finishedData);
			var taskClass = AS.TID2TASK[tid];
			taskClass.finish();
			AS.TID_ARRAY.pop(tid);
		},
		init: function($container){
			AS.store.$container = $container;
			var todoData = AS.store.get(AS.TODO_DATA);
			var finishedData = AS.store.get(AS.DONE_DATA);
			for(var tid in todoData){
				var data = todoData[tid];
				new Task(data);
				AS.TID_ARRAY.push(tid);
			}
			for (var tid in finishedData){
				var data = finishedData[tid];
				new Task(data);
			}
			//初始化设置
			AS.store.checkTaskStatus();
			var content = '未开启桌面通知功能';
			if(window.Notification !== 'denied'){
				window.Notification.requestPermission(function(permission){
		  			if(permission === "granted") {
		        		$('.a-notify').addClass('action');
						if(Notification.permission === 'granted'){
							content = '已经开启桌面通知功能';
							//桌面通知
							AS.notifer = {};
							AS.notify = function(title){
								if(!title || title.trim() == '') return;
								if(AS.notifer[title]){
									AS.notifer[title].close();
									AS.notifer[title] = void 0;
								}
								AS.notifer[title] = new Notification('来自TODO', {
									dir: 'ltr',
									body: '帅锅喊你改bug啦～',
									icon: '/images/logo.jpg'
								});
							};
						}
						$('[data-toggle="notify-popover"]').popover({
							html: true,
							placement: 'top',
							container: 'body',
							content: content
						});
		      		}
		    	});
			}
		},
		checkTaskStatus: function(){
			var now = new Date();
			var needNotify = false;
			for(var i in AS.TID_ARRAY){
				var key = parseInt(AS.TID_ARRAY[i]);
				var dif = (now - key)/1000/60;
				var tempColor = 'whitesmoke';
				for(var min in AS.settings.colorfulStatus){
					var col = AS.settings.colorfulStatus[min];
					var bgColor = AS.store.$container.find('a[data-key="'+key+'"]').css('background-color');
					var hex = rgbToHex(bgColor);
					if(dif >= min && hex!=col){
						needNotify = true;
						tempColor = col;
					}
				}
				AS.store.$container.find('a[data-key="'+key+'"]').css('background', tempColor);
			}
			needNotify && AS.notify('task');
		},
		startTimer: function(){
			if(timer) AS.store.stopTimer();
			console.log(parseInt(AS.settings.timerFrequency)*1000);
			timer = window.setInterval(AS.store.checkTaskStatus, parseInt(AS.settings.timerFrequency)*1000);
		},
		stopTimer: function(){
			if(timer) window.clearInterval(AS.store.checkTaskStatus);
		}
	};
})(AS, window.localStorage);
