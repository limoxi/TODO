/**
*	任务面板
*
*/

;(function (AS, undefined){
	if(!AS){
		console.error('store.js依赖AS.js');
	}

	AS.notify = AS.noop;
	AS.TODO_DATA = 'todoData';
	AS.DONE_DATA = 'finishedData';
	AS.TID2TASK = {};
	AS.TID_ARRAY = [];
	AS.settings = {
		timerFrequency: AS.storage.get('timer', AS.VALUE_TYPE['num'], 20),
		colorfulStatus: AS.storage.get('observer', AS.VALUE_TYPE['obj'], {})
	};
	var timer;
	AS.store = {
		setTimerFrequency: function(min){
			AS.settings.timerFrequency = min;
			AS.storage.set('timer', min);
			AS.store.startTimer();
		},
		setColorfulStatus: function(min, color){
			AS.settings.colorfulStatus[min+''] = color;
			AS.storage.set('observer', AS.settings.colorfulStatus);
		},
		get: function(mode){
			return AS.storage.get(mode, AS.VALUE_TYPE['obj'], {});
		},
		add: function(options){
			var newTask = new Task(options);
			AS.TID_ARRAY.push(newTask.tid);
		},
		set: function(mode, tid, data){
			var modeData = AS.store.get(mode);
			modeData[tid] = data;
			AS.storage.set(mode, modeData);
		},
		remove: function(mode, tid){
			var todoData = AS.store.get(AS.TODO_DATA);
			var returnData = todoData[tid];
			delete todoData[tid];
			AS.storage.set(mode, todoData);
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
			AS.store.startTimer();
		},
		checkTaskStatus: function(){
			var now = new Date();
			var needNotify = false;
			var curr_task;
			for(var i in AS.TID_ARRAY){
				var key = parseInt(AS.TID_ARRAY[i]);
				var dif = (now - key)/1000/60;
				var tempColor = 'whitesmoke';
				curr_task = AS.TID2TASK[key];
				if(!curr_task || curr_task.routine) continue; //如果是日常任务，则无需提醒
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
			timer = window.setInterval(AS.store.checkTaskStatus, parseInt(AS.settings.timerFrequency)*1000);
		},
		stopTimer: function(){
			if(timer) window.clearInterval(AS.store.checkTaskStatus);
		}
	};
})(AS);
