## 【炒冷饭造轮子】之 Promise

实现一个轮子之前，我们先得了解这个轮子。

首先附上官方说明：[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)

官方描述：
> Promise 对象是一个代理对象（代理一个值），被代理的值在Promise对象创建时可能是未知的。它允许你为异步操作的成功和失败分别绑定相应的处理方法（handlers）。 这让异步方法可以像同步方法那样返回值，但并不是立即返回最终执行结果，而是一个能代表未来出现的结果的promise对象

Promise 存在的意义，就是代替回调函数进行处理异步操作，Promise 被设计成可链式调用，这个特性很好的避免了回调的多层嵌套，提高了异步代码的可读性和可维护性。

示例：
```js
let myFirstPromise = new Promise(function(resolve, reject){
    //当异步代码执行成功时，我们才会调用resolve(...), 当异步代码失败时就会调用reject(...)
    //在本例中，我们使用setTimeout(...)来模拟异步代码，实际编码时可能是XHR请求或是HTML5的一些API方法.
    setTimeout(function(){
        resolve("成功!"); //代码正常执行！
    }, 250);
});

myFirstPromise.then(function(successMessage){
    //successMessage的值是上面调用resolve(...)方法传入的值.
    //successMessage参数不一定非要是字符串类型，这里只是举个例子
    console.log("Yay! " + successMessage);
});
```

简单了解了 Promise，我们就可以一步步拆解，来实现一个 Promise。

### 构造函数

Promise 的构造函数接收一个参数，类型为 ```Function```，我们称之为 ```executor```。执行构造函数的过程中，```executor``` 会被传入两个参数，一个叫 ```resolve```，另一个叫```reject```，这两个函数的实现在后面讲。

```js
function MyPromise(executor) {
    function resolve(value) {
        //TODO
    }
    function reject() {
        //TODO
    }
    excutor(resolve, reject);
}
```

### 状态 & 值
Promise 有三个状态，pending，resolved（也可以叫 fullfilled）, rejected

pending: Promise 的初始状态，此时 Promise 的值为 ```undefined```；
resolved: resolve 方法被执行后的状态，此时 Promise 的值为 resolve 接受的参数；
rejected: reject 方法被执行或者代码报错之后的状态，此时 Promise 的值为 reject 接收的参数，或者报错信息。

**注意：Promise 状态只能由 Pending 变成 Resolved 和 Rejected，且不可逆。**

根据以上特性，构造函数可以这样补充：

```js
const STATUS_PENDING = 'pending';
const STATUS_RESOLVED = 'resolved';
const STATUS_REJECTED = 'rejected';
function MyPromise(executor) {
    this.status = STATUS_PENDING;
    this.value = undefined;
    let that = this;
    function resolve(value) {
        if (that.status !== STATUS_PENDING) {
            return;
        }
        that.status = STATUS_RESOLVED;
        that.value = value;
    }
    function reject(error) {
        if (that.status !== STATUS_PENDING) {
            return;
        }
        that.status = STATUS_REJECTED;
        that.value = error;
    }
    excutor(resolve, reject);
}
```

这样就实现了一个基本的状态管理机制。

### then
then 是 Promise 最常用的一个方法，由于每一个实例都有自己的 then 方法，所以 then 应该位于原型上。
then 接收两个 Function 类型的参数，分别是 onResolved（在 resolved 状态时会调用）、onRejected（在 rejected 状态时会调用），这两个方法都接收一个参数，值为 Promise 的值。

```js
MyPromise.prototype = {};
MyPromise.prototype = {
    then: function(onResolved, onRejected) {
        if (!onResolved && !onRejected) { //不传任何参数时返回原来的 Promise
            return this;
        }
        //TODO
    }
}
```

then 有如下几个特性：
1. 返回一个新的 Promise，状态跟原来的 Promise 一致。

```js
MyPromise.prototype.then = function(onResolved, onRejected) {
    if (!onResolved && !onRejected) {
        return this;
    }
    let that = this;
    let ps = new MyPromise((res, rej) => {
        if (that.status === STATUS_RESOLVED) {
            let result = onResolved(that.value);
            res(result);
        }
        if (that.status === STATUS_REJECTED) {
            let result = onRejected(that.value);
            rej(result);
        }
        if (that.status === STATUS_PENDING) {
            //TODO
        }
    });
    return ps;
}
```

2. 执行 then 的时候有两种场景，一种是原来的 Promise 已经是 resolved/rejected 状态，这个时候会直接执行 onResolved/onRejected，并将返回值作为新的 Promise 的值；另一种情况，原来的 promise 还是 pending 状态，就要等原来的 promise 修改状态。所以 Promise 实例需要记录回调，当状态改变时，调用 onResolved/onRejected，并将结果作为 then 返回的 Promise 的值。

```js
MyPromise.prototype.then = function(onResolved, onRejected) {
    if (!onResolved && !onRejected) {
        return this;
    }
    let that = this;
    let resolve;
    let reject;
    let ps = new MyPromise((res, rej) => {
        if (that.status === STATUS_RESOLVED) {
            let result = onResolved(that.value);
            res(result);
        }
        if (that.status === STATUS_REJECTED) {
            let result = onRejected(that.value);
            rej(result);
        }
        if (that.status === STATUS_PENDING) {
            resolve = res; //+++
            reject = rej;   //+++
        }
    });
    
    if (onResolved && resolve) { //+++
        this.onResolved = () => {
            let result = onResolved.call(ps, that.value);
            resolve(result);
        };
    }
    if (onRejected && reject) { //+++
        this.onRejected = () => {
            reject(onRejected.call(ps, that.value));
        };
    }
    return ps;
}
```
构造函数也要做出相应的修改，在改变状态时执行相应的方法：

```js

function MyPromise(executor) {
    this.status = STATUS_PENDING;
    this.value = undefined;
    this.onResolved = null;
    this.onRejected = null;
    let that = this;
    function resolve(value) {
        if (that.status !== STATUS_PENDING) {
            return;
        }
        that.status = STATUS_RESOLVED;
        that.value = value;
        that.onResolved && that.onResolved(value); //+++
    }
    function reject(error) {
        if (that.status !== STATUS_PENDING) {
            return;
        }
        that.status = STATUS_REJECTED;
        that.value = error;
        that.onRejected && that.onRejected(error); //+++
    }
    excutor(resolve, reject);
}
```

3. 如果 onResolved 的执行结果是 Promise 实例，会将这个 Promise 的值作为新的 Promise 的值。
```js

MyPromise.prototype.then = function(onResolved, onRejected) {
    //......
    let ps = new MyPromise((res, rej) => {
        if (that.status === STATUS_RESOLVED) {
            let result = onResolved(that.value);
            if (result instanceof MyPromise) {
                result.then((v) => res(v), (v) => rej(v)); //+++
            } else {
                res(result);
            } 
        }
        //......
    });
    
    if (onResolved && resolve) {
        this.onResolved = () => {
            let result = onResolved.call(ps, that.value);
            if (result instanceof MyPromise) {
                result.then((v) => resolve(v), (v) => reject(v)); //+++
            } else {
                resolve(result);
            } 
        };
    }
    //......
}
```

### 告一段落
到此，一个最基础的 Promise 已经实现了，可以在控制台跑起来试试。

```js

let ps1 = new MyPromise((res) => window.res = res);
let ps2 = ps1.then((v) => {
    console.log(v);
    return 2;
});
window.res(1);
ps2.then((v) => console.log(v));
let ps3 = new Promise((res) => window.res1 = res);
let ps4 = ps3.then((v) => {
    console.log(v);
    return 4;
});
window.res1(3);
ps4.then((v) => console.log(v));
```

执行结果为：1 2 3 4。表现与原生的 Promise 一致。

### catch

catch 方法相当于 then(null, onRejected) 的语法糖，所以实现起来跟 then 差不多，这里为了方便，我们可以直接写成：
```js
MyPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
}
```

### 报错捕获

按照我们目前的实现，catch 只能处理 reject 的信息，不能获取报错信息，所以在执行各种回调函数的时候都要加上 try catch。

首先是构造函数，executor 执行时要 try catch：
```js
try {
    excutor(resolve, reject);
} catch(e) {
    reject(e);
}
```

然后是 then 方法中的 resolve/reject：
```js

MyPromise.prototype.then = function(onResolved, onRejected) {
    if (!onResolved && !onRejected) {
        return this;
    }
    let that = this;
    let resolve;
    let reject;
    let ps = new MyPromise((res, rej) => {
        if (that.status === STATUS_RESOLVED) {
            try { //+++
                let result = onResolved(that.value);
                if (result instanceof MyPromise) {
                    result.then((v) => res(v), (e) => rej(e));
                } else {
                    res(result);
                } 
            } catch(e) {
                rej(e);
            }
        }
        if (that.status === STATUS_REJECTED) {
            try { //+++
                rej(onRejected(that.value));
            } catch(e) {
                rej(e);
            }
        }
        if (that.status === STATUS_PENDING) {
            resolve = res;
            reject = rej;
        }
    });
    
    if (onResolved && resolve) {
        this.onResolved = () => {
            try {   //+++
                let result = onResolved.call(ps, that.value);
                if (result instanceof MyPromise) {
                    result.then((v) => resolve(v), (e) => reject(e));
                } else {
                    resolve(result);
                } 
            } catch(e) {
                reject(e);
            }
        };
    }
    if (onRejected && reject) {
        this.onRejected = () => {
            try {   //+++
                reject(onRejected.call(ps, that.value));
            } catch(e) {
                reject(e);
            }
        };
    }
    return ps;
}
```

### 异步
现在 Promise 的基本功能都已经实现了，但是还有一个很重要的特性我们没有处理：**then 里面的操作是异步的，并且属于微任务**，为了实现异步调用，我们封装一个方法：
```js
function asyncCall(fn) {
    if (window.queueMicrotask) {
        window.queueMicrotask(() => fn && fn.call());
    } else {
        setTimeout(() => fn && fn.call());
    }
}
```

这里的 queueMicrotask 是一个新 API，用于执行一个微任务，但是目前兼容性并不好（可在 [caniuse](https://caniuse.com/#search=queueMicrotask)中查询），如果浏览器不支持，我们可以用 setTimeout 来模拟。

接下来，我们可以把 then 里面调用 onResolved/onRejected 的部分用 asyncCall 包裹起来：

```js

MyPromise.prototype.then = function(onResolved, onRejected) {
    //......
    let ps = new MyPromise((res, rej) => {
        if (that.status === STATUS_RESOLVED) {
            asyncCall(() => { //+++
                try {
                    let result = onResolved(that.value);
                    if (result instanceof MyPromise) {
                        result.then((v) => res(v), (e) => rej(e));
                    } else {
                        res(result);
                    } 
                } catch(e) {
                    rej(e);
                }
            });
        }
        if (that.status === STATUS_REJECTED) {
            asyncCall(() => { //+++
                try {
                    rej(onRejected(that.value));
                } catch(e) {
                    rej(e);
                }
            });
        }
        //......
    });
    
    if (onResolved && resolve) {
        this.onResolved = () => {
            asyncCall(() => { //+++
                try {
                    let result = onResolved.call(ps, that.value);
                    if (result instanceof MyPromise) {
                        result.then((v) => resolve(v), (e) => reject(e));
                    } else {
                        resolve(result);
                    } 
                } catch(e) {
                    reject(e);
                }
            });
        };
    }
    if (onRejected && reject) {
        this.onRejected = () => {
            asyncCall(() => {   //+++
                try {
                    reject(onRejected.call(ps, that.value));
                } catch(e) {
                    reject(e);
                }
            });
        };
    }
    return ps;
}
```

这时再运行测试代码：
```js
console.log(0)
setTimeout(() => console.log(1));
(new MyPromise((res) => {
    console.log(2);
    res();
})).then(() => console.log(3));
setTimeout(() => console.log(4));
console.log(5);
```

结果是 0 2 5 3 1 4，经典的微任务宏任务面试题！

### 静态方法

除了上述实例方法以外，Promise 还提供了四个静态方法：

#### Promise.resolve/Promise.reject
返回一个状态为 resolved/rejected 的 promise 对象，值为传入的参数。

实现起来非常简单，new 一个实例，在 executor 里面直接 resolve/reject 就行了：
```js
MyPromise.resolve = function(value) {
    return new MyPromise((resolve) => {
        resolve(value);
    });
}
MyPromise.reject = function() {
    return new MyPromise((resolve, reject) => {
        reject(value);
    });
}
```

#### Promise.all/Promise.race
类似于 Array.prototype.every/Array.prototype.some，这两个方法都接收一个 promise 数组，返回一个 promise 对象，all 会在传入的所有 promise 都 resolve 之后变成 resolved 状态，race 会在任意一个 promise resolve 之后变成 resolved 状态。

```js
MyPromise.all = function(promises) {
    let resolvedCount = 0;
    let len = promises.length;
    let resolvedValues = new Array(len);
    return new MyPromise((resolve, reject) => {
        if (len === 0) {
            resolve(resolvedValues);
        }
        promises.forEach((ps, index) => {
            ps.then((val) => {
                resolvedCount++;
                resolvedValues[index] = val;
                if (resolvedCount === len) {
                    resolve(resolvedCount);
                }
            }).catch((e) => reject(e));
        })
    });
}

MyPromise.race = function(promises) {
    return new MyPromise((resolve, reject) => {
        promises.forEach((ps) => {
            ps.then((val) => {
                resolve(val);
            }).catch((e) => reject(e));
        });
    });
}
```
这两个方法在入参长度为零的时候的处理不太一样，这是标准约定的。

### 完成
整个 Promise 的 API 我们都已经完成了，欢迎吐槽。



