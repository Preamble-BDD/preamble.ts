/**
 * Callable API
 * afterEach(function([done]))
 */

import {AfterEach} from "../queue/AfterEach";
import {callStack} from "./CallStack";

export function afterEach(callback: (done?: () => void) => void, timeoutInterval = 0): void {
    let _afterEach;

    if (arguments.length !== 1 && arguments.length !== 2) {
        throw new TypeError("afterEach called with invalid parameters");
    }
    if (typeof (arguments[0]) !== "function") {
        throw new TypeError("afterEach called with invalid parameters");
    }
    if (arguments.length === 2 && typeof (arguments[1]) !== "number") {
        throw new TypeError("afterEach called with invalid parameters");
    }

    // an AfterEach object
    _afterEach = new AfterEach(callStack.uniqueId.toString(), callback, timeoutInterval);

    // add the AfterEach to the parent Describe
    callStack.getTopOfStack().afterEach = _afterEach;
}
