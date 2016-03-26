import {IMatcher} from "./matchers/IMatcher";
import {INote} from "./INote";
import {spyOn} from "./spy/spy";
import {currentIt} from "../queue/QueueRunner";

let matchers: IMatcher[] = [];
let expectationAPI = {};
let expectationAPICount = 0;
let negatedExpectationAPI = {};

interface Proxy {
    (...args): void;
}

let note: INote;

/**
 * argChecker - checks that the matcher has the
 * correct number of args passed to it.
 *
 * Allows for a fixed and a variable number of arguments.
 *
 * Returns true if # of args is correct & false otherwise.
 *
 * Example: To declare that a matcher can take
 * a variable number of args but must be passed
 * at least 1 arg then minArgs: 1 && maxArgs: -1.
 *
 * Example: To declare that a matcher can take
 * zero or more args then minArgs: 0 && maxArgs: -1.
 *
 * Example: To declare that a matcher can take
 * a fixed number of args then minArgs: n && maxArgs: n.
 *
 * Example: To declare that a matcher can take
 * from 3 to n args then minArgs: 3 && maxArgs: n.
 */
let argsChecker = (matcher, argsLength): boolean => {
    // fails if minArgs > maxArgs
    if (matcher.minArgs !== -1 && matcher.maxArgs !== -1 &&
        matcher.minArgs > matcher.maxArgs) {
        return false;
    }
    // allows for a variable number of args.
    if (matcher.minArgs !== -1 && argsLength < matcher.minArgs ||
        matcher.maxArgs !== -1 && argsLength > matcher.maxArgs) {
        note.exception = new Error(`${matcher.apiName}(): invalid arguments`);
        return false;
    }
    return true;
};

let addNoteToIt = (note: INote) => currentIt.expectations.push(note);

// add not api to expect api
expectationAPI["not"] = negatedExpectationAPI;

// expect(value)
export let expect = (ev: any): {} => {
    // if a callback was returned then call it and use what it returns for the expected value
    let expectedValue = ev;
    if (typeof (ev) === "function" && !ev.hasOwnProperty("_spyMaker")) {
        let spy = spyOn(ev).and.callActual();
        expectedValue = spy();
    }
    note = { it: currentIt, apiName: null, expectedValue: expectedValue, matcherValue: null, result: null, exception: null };
    return expectationAPI;
};

export let registerMatcher = (matcher: IMatcher): void => {
    let proxy = (not: boolean): Proxy => {
        return (...args): void => {
            note.apiName = not ? "not." + matcher.apiName : matcher.apiName;
            if (argsChecker(matcher, args.length)) {
                // don't call matcher.api if it doesn't return a value (e.g. toBeTrue)
                note.matcherValue = matcher.minArgs > 0 ? matcher.api.apply(null, args) : note.matcherValue;
                // if a callback was returned then call it and use what it returns for the matcher value
                note.matcherValue = note.matcherValue && typeof (note.matcherValue) === "function" && note.matcherValue() || note.matcherValue;
                if (not) {
                    if (matcher.minArgs) {
                        note.result = !matcher.evaluator(note.expectedValue, note.matcherValue);
                    } else {
                        note.result = !matcher.evaluator(note.expectedValue);
                    }
                } else {
                    if (matcher.minArgs) {
                        note.result = matcher.evaluator(note.expectedValue, note.matcherValue);
                    } else {
                        note.result = matcher.evaluator(note.expectedValue);
                    }
                }
                addNoteToIt(note);
                // set It's and its parent Describe's passed property to false when expectation fails
                currentIt.passed = !note.result ? note.result : currentIt.passed;
                currentIt.parent.passed = !note.result ? note.result : currentIt.parent.passed;
                console.log("note", note);
            } else {
                console.log("note", note);
            }
        };
    };
    console.log("Registering matcher", matcher.apiName);
    expectationAPI[matcher.apiName] = proxy(false);
    if (matcher.negator) {
        negatedExpectationAPI[matcher.apiName] = proxy(true);
    }
    expectationAPICount++;
};

export let matchersCount = (): number => expectationAPICount;
