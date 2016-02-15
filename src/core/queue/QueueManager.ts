/**
 * QueueManager
 * Periodically checks the length of the queue.
 * If it remains stable over a period of time it
 * signals that the queue is ready to be processed.
 */

/**
 * Note: ts compiler will elide this import because q is only being
 * used as a type guard. See QueueManager construcor, particularly its
 * declaration of Q.
 */
import q = require("q");
import {IDescribe} from "./IDescribe";
import {IIt} from "./IIt";
import {It} from "./It";
import {mix} from "./mix";

import {configuration} from "../configuration/configuration";

export class QueueManager {
    static queue: IDescribe[] = [];
    static totIts: number = 0;
    static totExclIts: number = 0;
    constructor(private timerInterval: number, private stableRetryCount: number, private Q: typeof q /** see Note above */) { }
    run(): Q.Promise<string | Error> {
        let deferred = this.Q.defer<string | Error>();
        let retryCount: number = 0;
        let prevCount: number = 0;
        let intervalId = setInterval(() => {
            console.log("QueueManager checking queue length stability");
            if (QueueManager.queue.length === prevCount) {
                retryCount++;
                if (retryCount > this.stableRetryCount) {
                    clearInterval(intervalId);
                    if (QueueManager.queue.length === 0) {
                        deferred.reject(new Error("Nothing to test!"));
                    } else {
                        console.log("QueueManager queue stable.");
                        deferred.resolve("QueueManager.queue loaded. Count = " + QueueManager.queue.length + ".");
                    }
                }
            } else if (QueueManager.queue.length > prevCount) {
                prevCount = QueueManager.queue.length;
            }
        }, this.timerInterval);
        return deferred.promise;
    }
    /**
     * Call a function which must complete within a set amount of time asynchronously.
     * If the function fails to complete within its given time limit then its promise
     * is rejected. If the function completes within its given time limit then its
     * promise is resolved.
     *
     * Example:
     * beforeEach(cb, timeoutInterval) ==> asyncWithTimeLimit(cb(done), timoutInterval)
     */
    runBeforeAfter(fn: (done?: () => void) => any, ms: number, context: {}): Q.Promise<string | Error> {
        let deferred = this.Q.defer<string | Error>();
        let completed = false;
        let timedOut = false;
        // A timer whose callback is triggered after ms have expired
        // and which rejects the promise if the promise isn't already
        // resolved.
        let timerId = setTimeout(function() {
            if (!completed) {
                timedOut = true;
                deferred.reject(
                    new Error(`Function failed to complete within {ms}`)
                );
            }
        }, ms);
        // A timer whose callback is triggered after 1 ms has expired which
        // calls fn passing it a callback that when called resolves the promise
        // if timedOut is false.
        if (fn.length) {
            // Asynchronous - call fn passing it done
            setTimeout(function() {
                fn.call(context, () => {
                    if (!timedOut) {
                        clearTimeout(timerId);
                        completed = true;
                        deferred.resolve();
                    }
                });
            }, 1);
        } else {
            // Synchronous
            setTimeout(function() {
                fn.call(context);
                if (!timedOut) {
                    clearTimeout(timerId);
                    completed = true;
                    deferred.resolve();
                }
            }, 1);
        }
        // Immediately return a promise to the caller.
        return deferred.promise;
    }
    runTests(): Q.Promise<string | Error> {
        let deferred = this.Q.defer<string | Error>();
        let timeoutInterval: number;
        let item: mix;
        for (let i = 0; i < QueueManager.length; i++) {
            let describe: IDescribe = QueueManager.queue[i];
            for (let ii = 0; ii < describe.items.length; ii++) {
                item = describe.items[ii];
                if (item instanceof It) {
                    console.log("item instance of It");
                    if (describe.beforeEach) {
                        timeoutInterval = describe.beforeEach.timeoutInterval > 0 &&
                            describe.beforeEach.timeoutInterval || configuration.timeoutInterval;
                        this.runBeforeAfter(describe.beforeEach.callback, timeoutInterval, describe.context)
                            .then(function() {
                                console.log("runBeforeAfter success!");
                                console.log("describe.context", describe.context);
                            }, function(err: Error) {
                                console.log("runBeforeAfter failed!");
                                console.log(err.message);
                            });
                    }
                } else {
                    console.log("item instance of Describe");
                }
            }
        }
        return deferred.promise;
    }
}
