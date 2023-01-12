const recordset1 = [
    {id: {"a": "1", "b": "1"}, measure: {"v1": 1, "v2": 8}},
    {id: {"a": "2", "b": "1"}, measure: {"v1": 2, "v2": 7}},
    {id: {"a": "3", "b": "1"}, measure: {"v1": 3, "v2": 6}},
    {id: {"a": "4", "b": "1"}, measure: {"v1": 4, "v2": 5}},
    {id: {"a": "1", "b": "2"}, measure: {"v1": 5, "v2": 4}},
    {id: {"a": "2", "b": "2"}, measure: {"v1": 6, "v2": 3}},
    {id: {"a": "3", "b": "2"}, measure: {"v1": 7, "v2": 2}},
    {id: {"a": "4", "b": "2"}, measure: {"v1": 8, "v2": 1}}
];

const recordset2 = [
    {id: {"a": "1"}, measure: {"v1": 1, "v2": 8}},
    {id: {"a": "2"}, measure: {"v1": 2, "v2": 7}},
    {id: {"a": "3"}, measure: {"v1": 3, "v2": 6}},
    {id: {"a": "4"}, measure: {"v1": 4, "v2": 5}}
];


/*
t
 + 3
 + 4
 + a
   - 1
   + 2
 */

const h_a = [
    {"from": "3", "sign": "+", "to": "t"},
    {"from": "a", "sign": "+", "to": "t"},
    {"from": "1", "sign": "+", "to": "a"},
    {"from": "2", "sign": "+", "to": "a"},
    {"from": "4", "sign": "+", "to": "t"}
];

const h_b = [
    {"from": "1", "sign": "+", "to": "t"},
    {"from": "2", "sign": "+", "to": "t"}
];

function hierachySorter(h) {
    if (h.length == 0) return [];

    const relations = h.reduce((accumulator, current) => {
        if (!(current.from in accumulator)) accumulator[current.from] = {"parents": [current.to], "children": []};

        if (!(current.to in accumulator)) accumulator[current.to] = {"parents": [], "children": [current.from]};

        // @ts-ignore
        accumulator[current.from].parents = [...new Set([...accumulator[current.from].parents, current.to])];
        // @ts-ignore
        accumulator[current.to].children = [...new Set([...accumulator[current.to].children, current.from])];

        return accumulator;
    }, {});

    const base = h
        .filter(item => {
            return relations[item.to].children.every(sibling => {
                return relations[sibling].children.length == 0
            });
        });

    const baseFromKeys = Object.keys(
        base.reduce((accumulator, current) => {
            accumulator[current.from] = current.from;
            return accumulator;
        }, {})
    );

    const rest = h.filter(item => !baseFromKeys.some(baseKey => baseKey === item.from));
    const subResult = hierachySorter(rest);

    return [].concat(...base, subResult);
}

/*
function pick(obj, keys){
    return keys
        .filter(key => key in obj) // line can be removed to make it inclusive
        .reduce((obj2, key) => {
            obj2[key] = obj[key];
            return obj2
        }, {});
}
*/
function omit(obj, keys) {
    return Object.keys(obj)
        .filter(key => keys.indexOf(key) < 0)
        .reduce((obj2, key) => {
            obj2[key] = obj[key];
            return obj2
        }, {});
}

function orderKeys(obj) {
    return Object.keys(obj)
        .sort((k1, k2) => {
            if (k1 < k2) return -1;
            else if (k1 > k2) return +1;
            else return 0;
        })
        .reduce((o, key) => {
            o[key] = obj[key];
            return o;
        }, {});
}


function recordset2hierarchyset(recordset, idKey) {
    let result = {};

    recordset.map(row => {
        const idkeyValue = row.id[idKey];
        const restOfId = omit(row.id, [idKey]);
        const sortedIds = orderKeys(restOfId);
        const JsonIdString = JSON.stringify(sortedIds);

        if (!(JsonIdString in result))
            result[JsonIdString] = {}

        result[JsonIdString][idkeyValue] = row.measure;
    });

    return result;
}

function hierarchyset2recordset(hierarchyset, idKey) {
    let result = [];

    for (const JsonIdString in hierarchyset) {
        const restOfId = JSON.parse(JsonIdString)

        for (const idkeyValue in hierarchyset[JsonIdString]) {
            let id1 = {};
            id1[idKey] = idkeyValue;
            const id = {...id1, ...restOfId};
            const measure = hierarchyset[JsonIdString][idkeyValue];

            result.push({"id": id, "measure": measure});
        }
    }

    return result;
}

function hierarchy(recordset, idKey, h) {
    const sortedHierarchy = hierachySorter(h)
    const hierarchyset = recordset2hierarchyset(recordset, idKey);
    const hierarchysetAggregated = Object.keys(hierarchyset).reduce((accumulatorHset, JsonIdString) => {
        accumulatorHset[JsonIdString] = sortedHierarchy.reduce((accumulatorKey, aggr) => {
            const {to, from, sign} = aggr;

            if (!(to in accumulatorKey)) accumulatorKey[to] = {}

            for (const measureKey in accumulatorKey[from]) {
                const measureValue = accumulatorKey[from][measureKey];

                if (!(accumulatorKey[to][measureKey]))
                    accumulatorKey[to][measureKey] = 0;

                if (sign === "+" && !isNaN(measureValue))
                    accumulatorKey[to][measureKey] += measureValue;

                if (sign === "-" && !isNaN(measureValue)) {
                    accumulatorKey[to][measureKey] -= measureValue;
                }
            }

            return accumulatorKey;
        }, accumulatorHset[JsonIdString]);

        return accumulatorHset;
    }, hierarchyset);

    return hierarchyset2recordset(hierarchysetAggregated, idKey);
}

const result1_a = hierarchy(recordset1, "a", h_a);
const result1 = hierarchy(result1_a, "b", h_b);

//console.log(JSON.stringify(result1));


const result2 = hierarchy(recordset2, "a", h_a);
console.log(JSON.stringify(result2));
