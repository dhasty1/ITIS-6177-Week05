exports.handler = async (event) => {
    const keyword = event.queryStringParameters && event.queryStringParameters.keyword;

    const response = {
        statusCode: 200,
        body: JSON.stringify(`Logan Hasty says ${keyword}!`),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    return response;
};