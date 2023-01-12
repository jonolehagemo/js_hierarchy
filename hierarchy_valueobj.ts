let i = 0;



const recordset1 = [
    {
        "id": {"a": "1", "b": "1"},
        "measure": {
            "v1": {
                "value": 1,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 8, "id" : "m", "attributes" : {}*/
            }
        }
    },
    {
        "id": {"a": "2", "b": "1"},
        "measure": {
            "v1": {
                "value": 2,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 7, "id" : "n", "attributes" : {}*/
            }
        }
    },
    {
        "id": {"a": "3", "b": "1"},
        "measure": {
            "v1": {
                "value": 3,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 6, "id" : "o", "attributes" : {}*/
            }
        }
    },
    {
        "id": {"a": "4", "b": "1"},
        "measure": {
            "v1": {
                "value": 4,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 5, "id" : "p", "attributes" : {}*/
            }
        }
    },
    {
        "id": {"a": "1", "b": "2"},
        "measure": {
            "v1": {
                "value": 5,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 4, "id" : "q", "attributes" : {}*/
            }
        }
    },
    {
        "id": {"a": "2", "b": "2"},
        "measure": {
            "v1": {
                "value": 6,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 3, "id" : "r", "attributes" : {}*/
            }
        }
    },
    {
        "id": {"a": "3", "b": "2"},
        "measure": {
            "v1": {
                "value": 7,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 2, "id" : "s", "attributes" : {}*/
            }
        }
    },
    {
        "id": {"a": "4", "b": "2"},
        "measure": {
            "v1": {
                "value": 8,
                "id": create_UUID(),
                "attributes": { "base" : true }/*, "v2": {"value": 1, "id" : "t", "attributes" : {}*/
            }
        }
    }
];




/*
t
 + 3
 + 4
 + d
   - 1
   + 2
 */

const h_a = [
    {"from": "3", "sign": "+", "to": "t"},
    {"from": "d", "sign": "+", "to": "t"},
    {"from": "1", "sign": "-", "to": "d"},
    {"from": "2", "sign": "+", "to": "d"},
    {"from": "4", "sign": "+", "to": "t"}
];

/*
t
 + 1
 + 2
 */

const h_b = [
    {"from": "1", "sign": "+", "to": "t"},
    {"from": "2", "sign": "+", "to": "t"}
];

function create_UUID() {
    let dt = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function hierachySorter(h) {
    if (h.length == 0) return [];

    const relations = h.reduce((accumulator, current) => {
        if (!(current.from in accumulator)) accumulator[current.from] = {"parents": [current.to], "children": []};
        if (!(current.to in accumulator)) accumulator[current.to] = {"parents": [], "children": [current.from]};

        accumulator[current.from].parents = [...accumulator[current.from].parents, current.to].filter((x, i, a) => a.indexOf(x) == i);
        accumulator[current.to].children = [...accumulator[current.to].children, current.from].filter((x, i, a) => a.indexOf(x) == i);

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

    const rest = h.filter(item => baseFromKeys.every(baseKey => baseKey !== item.from));
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

    // console.log("recordset2hierarchyset -> recordset : " + JSON.stringify(recordset));

    recordset.map(row => {
        const idkeyValue = row.id[idKey];
        const restOfId = omit(row.id, [idKey]);
        const sortedIds = orderKeys(restOfId);
        const JsonIdString = JSON.stringify(sortedIds);

        if (!(JsonIdString in result))
            result[JsonIdString] = {}

        result[JsonIdString][idkeyValue] = row.measure;
    });

    // console.log("recordset2hierarchyset -> hierarchyset : " + JSON.stringify(result));


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

function hierarchy(recordset, idKey, h){
    const sortedHierarchy = hierachySorter(h)
    // console.log("sortedHierarchy : " + JSON.stringify(sortedHierarchy));

    const hierarchyset = recordset2hierarchyset(recordset, idKey);
    // console.log("hierarchyset : " + JSON.stringify(hierarchyset));

    const hierarchysetAggregated = Object.keys(hierarchyset).reduce((accumulatorHset, JsonIdString) => {
        accumulatorHset[JsonIdString] = sortedHierarchy.reduce((accumulatorKey, aggr) => {
            const {to, from, sign} = aggr;

            if (!(to in accumulatorKey)) accumulatorKey[to] = {}

            for (const measureKey in accumulatorKey[from]) {
                const measureValue = accumulatorKey[from][measureKey].value;
//                console.log("measureValue : " + JSON.stringify(measureValue));

                if (!(accumulatorKey[to][measureKey])) {
                    accumulatorKey[to][measureKey] = {
                        "value": 0,
                        "id": create_UUID(),
                        "attributes": {
                            "sum": []
                        }
                    };

                    console.log("CREATE (m" + i + ":Measure:Sum:Key" + idKey.toUpperCase() + " {id :'" + accumulatorKey[to][measureKey].id + "', value : 0});")
                }

                if (!isNaN(measureValue)) {
                    if (sign === "+") accumulatorKey[to][measureKey].value += measureValue
                    if (sign === "-") accumulatorKey[to][measureKey].value -= measureValue

                    accumulatorKey[to][measureKey].attributes.sum.push({
                        "sign": sign,
                        "value": measureValue,
                        "id": accumulatorKey[from][measureKey].id
                    })

                    console.log("MATCH (m" + (i+1) + ":Measure {id :'" + accumulatorKey[to][measureKey].id + "'}) set m" + (i+1) + ".value = " + accumulatorKey[to][measureKey].value + ";")
                    console.log("MERGE (f" + (i+3) + ":Measure {id: '" + accumulatorKey[from][measureKey].id + "', value : " + measureValue + "});")
                    console.log("MATCH (m" + (i+2) + ":Measure {id :'" + accumulatorKey[to][measureKey].id + "'}) \nMATCH (f" + (i+4) + ":Measure {id: '" + accumulatorKey[from][measureKey].id + "'}) \nMERGE (f" + (i+4) + ")-[:AggregatesTo {sign : '" + sign + "'}]->(m" + (i+2) + ");")
                }
                i = i+4;
            }

            return accumulatorKey;
        }, accumulatorHset[JsonIdString]);

        return accumulatorHset;
    }, hierarchyset);

    return hierarchyset2recordset(hierarchysetAggregated, idKey);
}

const result1_a = hierarchy(recordset1, "a", h_a);
const result1 = hierarchy(result1_a, "b", h_b);

console.log(JSON.stringify(result1, null, 2));

// const result2 = hierarchy(recordset2, "a", h_a);
// console.log(JSON.stringify(result2));

