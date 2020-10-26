import "@babel/polyfill";
import FeatureGates from '../src/index';

const dummyFGs = {
  atoms: {
    filters: {
      defaultFilters: {
        defaultTest1: "dtest1",
        defaultTest2: "dtest2"
      },
      workspaces: {
        ws1: {
          ws1Test1: "w1test1",
          ws1Test2: "w1test2"
        },
      }
    }
  }
};

let fg;
beforeEach(() => {
  fg = new FeatureGates({
    gates: dummyFGs,
    translateMap: {
      filters: {
        path: "atoms.filters",
        transformer: ({ defaultFilters, workspaces = {} }) => ({
          defaults: defaultFilters,
          ...workspaces
        })
      },
    },
    filterMap: {
      filters: (value, { workspaceId }) => ({
        ...value.defaults,
        ...value[workspaceId]
      })
    }
  });
  fg.load();
});

describe("Filter map tests", () => {
  it("should give back the entire set of unfiltered feature gates", () => expect(fg.get()).toEqual({
    filters: {
      defaults: {
        defaultTest1: "dtest1",
        defaultTest2: "dtest2",
      },
      ws1: {
        ws1Test1: "w1test1",
        ws1Test2: "w1test2"
      }
    }
  }));

  it("should give back the entire set of filtered feature gates", () => expect(fg.get({
    workspaceId: "ws1"
  })).toEqual({
    filters: {
      defaultTest1: "dtest1",
      defaultTest2: "dtest2",
      ws1Test1: "w1test1",
      ws1Test2: "w1test2"
    }
  }));

  it("should give back single filtered feature gate", () => expect(fg.get("filters", {
    filters: {
      workspaceId: "ws1"
    }
  })).toEqual({
    defaultTest1: "dtest1",
    defaultTest2: "dtest2",
    ws1Test1: "w1test1",
    ws1Test2: "w1test2"
  }));
});