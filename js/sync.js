//与野狗云同步 https://itodo.wilddogio.com
function Sync(url){
	// this.dog = new Wilddog(url);
	// this.user_id = uuid;
	// this.storeVersion = window.localStorage.getItem('version') || 0;
}
Sync.prototype = {
	sync: function(){
		var that = this;
		that.dog.child(that.user_id+'/version').once(function(obj){
			var version = obj.val();
			if(that.storeVersion != version){
				if(that.storeVersion > version){
					var uploadData = {};
					uploadData[that.user_id] = {
						'version': that.storeVersion,
						'todoData': window.localStorage.getItem('todoData'),
						'finishedData': window.localStorage.getItem('finishedData')
					}
					that.dog.update(uploadData);

				}else{
					that.dog.child(that.user_id).once(function(obj){
						var downData = obj.val();
					});
				}
			}
		});
	}
};

AS.sync = new Sync('https://itodo.wilddogio.com');