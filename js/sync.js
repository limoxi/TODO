//与野狗云同步 https://itodo.wilddogio.com

(function(AS){
	var wilddogUrl = 'https://itodo.wilddogio.com';
	var uuid = AS.storage.get(AS.VALUE_TYPE['str'], 'uuid', new Date().getTime().toString());
	AS.storage.set('uuid', uuid);
	var storeVersion = AS.storage.get(AS.VALUE_TYPE['num'], 'version', 1);
	AS.storage.set('version', storeVersion);
	var dog = new Wilddog(wilddogUrl);
	var remoteVersionRef = dog.child(uuid + '/version');
	var remoteDataRef = dog.child(uuid + '/data');
	var syncManager = {
		sync: function(){
			
			if('true' === AS.storage.get(AS.VALUE_TYPE['str'], 'storageChanged')){ //本地一旦改变，版本号自增
				AS.storage.set('version', ++storeVersion);
			}
			remoteVersionRef.once('value', function(obj){
				var version = obj.val();
				version = version? parseInt(version): false;
				console.log('version ===>>', version);
				if(storeVersion > version || !version){
					syncManager.push(storeVersion);
				}else if(storeVersion < version){
					syncManager.pull(version);
				}
			});
			AS.storage.set('storageChanged', 'false');
		},
		push: function(storeVersion){
			var uploadData = {
				'todoData': AS.storage.get(AS.VALUE_TYPE['obj'], 'todoData', {}),
				'finishedData': AS.storage.get(AS.VALUE_TYPE['obj'], 'finishedData', {}),
				'observer': AS.storage.get(AS.VALUE_TYPE['obj'], 'observer', {}),
				'timer': AS.storage.get(AS.VALUE_TYPE['num'], 'timer', 30),
			}
			remoteDataRef.update(uploadData);
			remoteVersionRef.set(storeVersion);
			console.log('同步完成，上传数据');
		},
		pull: function(version){
			remoteDataRef.once('value', function(obj){
				var downData = obj.val();
				AS.storage.save(downData);
				storeVersion = version;
				AS.storage.set('version', version);
				console.log('同步完成，下载数据', downData);
				window.location.reload(true);
			});
		}
	};
	AS.sync = syncManager;
})(AS);
