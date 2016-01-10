//与野狗云同步 https://itodo.wilddogio.com

(function(AS){
	var wilddogUrl = 'https://itodo.wilddogio.com',
		dog;
	try{
		dog = new Wilddog(wilddogUrl);
		AS.is_online = true;
	}catch(e){
		console.warn('目前属于离线状态');
		return;
	}
	var remoteVersionRef,
		remoteDataRef,
		storeVersion;
	
	var syncManager = {
		init: function(action, uuid, failCallback){
			storeVersion = AS.storage.get(AS.VALUE_TYPE['num'], 'version', 1);
			if(action){
				dog.once('value', function(obj){
					if(obj.child(uuid).exists()){
						AS.storage.set('uuid', uuid);
						remoteVersionRef = dog.child(uuid + '/version');
						remoteDataRef = dog.child(uuid + '/data');
						remoteVersionRef.once('value', function(obj){
							if(obj.val()){
								syncManager.pull(obj.val());
							}
						});
					}else{
						failCallback();
					}
				});
			}else{
				remoteVersionRef = dog.child(uuid + '/version');
				remoteDataRef = dog.child(uuid + '/data');
			}
			
		},
		sync: function(){
			if('true' === AS.storage.get(AS.VALUE_TYPE['str'], 'storageChanged')){ //本地一旦改变，版本号自增
				storeVersion = AS.storage.get(AS.VALUE_TYPE['num'], 'version');
				AS.storage.set('version', ++storeVersion);
			}
			
			remoteVersionRef.once('value', function(obj){
				var version = obj.val();
				version = version? parseInt(version): false;
				if(storeVersion > version || !version){
					syncManager.push(storeVersion);
				}else if(storeVersion < version){
					syncManager.pull(version);
				}else{
					AS.toast('无需同步，数据一致');
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
			AS.toast('同步完成，上传数据', 'success');
		},
		pull: function(version){
			remoteDataRef.once('value', function(obj){
				var downData = obj.val();
				AS.storage.save(downData);
				storeVersion = version;
				AS.storage.set('version', version);
				AS.toast('同步完成，下载数据', 'success');
				window.location.reload(true);
			});
		}
	};
	AS.sync = syncManager;
})(AS);
