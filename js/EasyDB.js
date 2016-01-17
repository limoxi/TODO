/**
 * Created by Asia on 15/08/09.
 */

 (function(window, undefined){
    function EasyDB(dbname){
        if(!window.indexedDB){
            AS.toast('该浏览器不支持indexedDB!!');
            return;
        }
        this.db = window.indexedDB;
        this.idbTransaction = window.IDBTransaction;
        this.version = 1;
        this.dbname = dbname || 'todo';
        this.request = null;
        this.dbresult = null;
        this.objectstore = null;
        this.actionCallback = null;
        this.isReady = false;
        this.checkReadyTimer = null;
        this.db.deleteDatabase(this.dbname);
        this.open(this.dbname);
    }

    EasyDB.prototype.open = function(){
        this.isReady = false;
        var that = this;
        if(this.dbresult) this.dbresult.close();
        this.request = this.db.open(this.dbname, this.version);
        this.request.onerror = function(e){
            AS.toast('本地数据库创建/打开失败', 'error');
        };

        this.request.onsuccess = function(e){
            that.dbresult = e.target.result;
            that.objectstore = that.dbresult.transaction([].push(name), that.idbTransaction.READ_WRITE).objectStore(name);
            that.isReady = true;
        };

        this.request.onupgradeneeded = function (e) {
            console.log('create objectstore');
            that.objectstore = e.target.result.createObjectStore(name);
            that.isReady = true;
        };
    };

    EasyDB.prototype.put = function(name, blob){
        var that = this;
        if(this.isReady){
            this.objectstore.put(blob, name);
            window.clearTimeout(this.checkReadyTimer);
        }else{
            this.checkReadyTimer = window.setTimeout(function(){
                that.put(name, blob, that.dbname);
            }, 100);
        }
    };

    EasyDB.prototype.get = function(name){
        var that = this;
        if(this.isReady){
            window.clearTimeout(this.checkReadyTimer);
            return this.objectstore.get(name);
        }else{
            this.checkReadyTimer = window.setTimeout(function(){
                that.get(name, that.dbname);
            }, 100);
        }
    };

    var store = {};
 })(window);


