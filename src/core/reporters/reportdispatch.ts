import {Reporter} from "./Reporter";

export class ReportDispatch implements Reporter {
    private _reporters: Reporter[];
    reportBegin(configOptions: { uiTestContainerId: string, name: string, hidePassedTests: boolean }): void {
        this._reporters.forEach((report) => report.reportBegin(configOptions));
    }
    reportSummary(summaryInfo: { totDescribes: number, totExcDescribes: number, totIts: number, totFailedIts: number, totExcIts: number, name: string, totTime: number }): void {
        this._reporters.forEach((report) => report.reportSummary(summaryInfo));
    }
    reportSuite(): void {
    }
    reportSpec(it): void {
        this._reporters.forEach((report) => report.reportSpec(it));
    }
    reportEnd(): void {
    }
    set reporters(reporters) {
        this._reporters = reporters;
    }
}

export let reportDispatch = new ReportDispatch();
