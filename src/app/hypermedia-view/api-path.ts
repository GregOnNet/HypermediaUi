export class ApiPath {
   private apiPath: Array<string> = [];

    constructor(apiPath: Array<string> = []) {
      this.apiPath = apiPath;
    }

    initFromRouterParams(routerParameters: any) {
      let apiPath: any;
      apiPath = routerParameters['apiPath'];

      if (!apiPath) {
        this.apiPath = [];
        return;
      }

      if (!Array.isArray(apiPath)) {
        apiPath = [apiPath];
      }

      this.apiPath = apiPath;
    }

    clear() {
      this.apiPath = [];
    }

    get newestSegment(): string {
      return this.apiPath[this.apiPath.length - 1]
    }

    get hasPath(): boolean {
      return this.apiPath.length > 0;
    }

    get fullPath(): Array<string> {
      return [...this.apiPath];
    }

    addStep(stepUrl: string) {
      const stepIndex = this.getStepIndex(stepUrl);
      if (stepIndex === -1 ) {
        this.apiPath.push(stepUrl);
        return;
      }

      this.apiPath = this.apiPath.slice(0, stepIndex + 1);
    }

    private getStepIndex(stepUrl: string): number {
      for (let i = 0; i < this.apiPath.length; i++) {
        if (this.apiPath[i] === stepUrl) {
          return i;
        }
      }

      return -1;
    }
}
