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
	AS.TODO_DATA = 'todoData';
	AS.DONE_DATA = 'finishedData';
	AS.TID2TASK = {};
	AS.store = {
		get: function(mode){
			var str = storage.getItem(mode);
			if(!str) return {};
			return JSON.parse(str);
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
			return returnData
		},
		finish: function(tid){
			var finishedData = AS.store.remove(AS.TODO_DATA, tid);
			AS.store.set(AS.DONE_DATA, tid, finishedData);
			var taskClass = AS.TID2TASK[tid];
			taskClass.finish();
		},
		init: function(){
			var todoData = AS.store.get(AS.TODO_DATA);
			var finishedData = AS.store.get(AS.DONE_DATA);
			for(var tid in todoData){
				var data = todoData[tid];
				new Task(data);
			}
			for (var tid in finishedData){
				var data = finishedData[tid];
				new Task(data);
			}
		}
	};
})(AS, window.localStorage);