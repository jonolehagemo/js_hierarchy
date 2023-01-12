exports.smokeTest = function () {
    const neo4j = require('neo4j-driver')
    const uri = "neo4j://localhost";
    const user = "kostra_kommregn";
    const password = "kostra_kommregn";


    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
    const session = driver.session()
    const personName = 'Alice'

    try {
        const result = session.run(
            'CREATE (a:Person {name: $name}) RETURN a',
            {name: personName}
        )

        const singleRecord = result.records[0]
        const node = singleRecord.get(0)

        console.log(node.properties.name)
    } finally {
        session.close()
    }

// const result2 = hierarchy(recordset2, "a", h_a);
// console.log(JSON.stringify(result2));

// on application exit:
    driver.close()
};

