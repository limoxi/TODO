//与野狗云同步 https://itodo.wilddogio.com

(function(AS, storage){
	var wilddogUrl = 'https://itodo.wilddogio.com';
	var uuid = storage.getItem('uuid') || new Date().getTime().toString();
	storage.setItem('uuid', uuid);
	var storeVersion = parseInt(storage.getItem('version') || 1);
	storage.setItem('version', storeVersion);
	var dog = new Wilddog(wilddogUrl);
	var remoteVersionRef = dog.child(uuid + '/version');
	var remoteDataRef = dog.child(uuid + '/data');
	var syncManager = {
		sync: function(){
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
		},
		push: function(storeVersion){
			var uploadData = {
				'todoData': storage.getItem('todoData'),
				'finishedData': storage.getItem('finishedData'),
				'observer': storage.getItem('observer'),
				'timer': storage.getItem('timer'),
			}
			remoteDataRef.update(uploadData);
			remoteVersionRef.set(storeVersion);
			console.log('同步完成，上传数据');
		},
		pull: function(version){
			remoteDataRef.once('value', function(obj){
				var downData = obj.val();
				//TODO 存储下载的数据
				console.log(downData);
				console.log('同步完成，下载数据');
				storeVersion = version;
				storage.setItem('version', version);
				AS.storage.clear();
			});
		}
	};
	AS.sync = syncManager;
})(AS, window.localStorage);
