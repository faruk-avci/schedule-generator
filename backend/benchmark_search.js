const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'https://api.ozuplanner.com';
const TEST_QUERIES = ['COMP', 'MATH', 'CS', 'ENG', 'PHYS', 'ECON', 'BUS', 'LAW'];
const ITERATIONS = 5; // Run each query 5 times

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

async function benchmarkEndpoint(url, query) {
    const start = Date.now();
    try {
        const response = await axios.post(url, { courseName: query });
        const duration = Date.now() - start;
        const cacheStatus = response.headers['x-cache'] || 'UNKNOWN';
        return {
            success: true,
            duration,
            cacheStatus,
            resultCount: response.data.count || 0
        };
    } catch (error) {
        return {
            success: false,
            duration: Date.now() - start,
            error: error.message
        };
    }
}

async function runBenchmark() {
    console.log(`${colors.cyan}===========================================`);
    console.log(`📊 Search Performance Benchmark`);
    console.log(`===========================================`);
    console.log(`🌐 Server: ${BASE_URL}`);
    console.log(`🔍 Test Queries: ${TEST_QUERIES.join(', ')}`);
    console.log(`🔄 Iterations: ${ITERATIONS} per query${colors.reset}\n`);

    const results = {
        current: { times: [], cacheHits: 0, cacheMisses: 0 },
        optimized: { times: [], cacheHits: 0, cacheMisses: 0 }
    };

    for (const query of TEST_QUERIES) {
        console.log(`${colors.yellow}Testing query: "${query}"${colors.reset}`);

        for (let i = 0; i < ITERATIONS; i++) {
            // Test current endpoint
            const currentResult = await benchmarkEndpoint(
                `${BASE_URL}/api/courses/search`,
                query
            );

            if (currentResult.success) {
                results.current.times.push(currentResult.duration);
                if (currentResult.cacheStatus === 'HIT') results.current.cacheHits++;
                else results.current.cacheMisses++;
            }

            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 100));

            // Test optimized endpoint
            const optimizedResult = await benchmarkEndpoint(
                `${BASE_URL}/api/courses-v2/search`,
                query
            );

            if (optimizedResult.success) {
                results.optimized.times.push(optimizedResult.duration);
                if (optimizedResult.cacheStatus === 'HIT') results.optimized.cacheHits++;
                else results.optimized.cacheMisses++;
            }

            process.stdout.write('.');
        }
        console.log(' ✓\n');
    }

    // Calculate statistics
    const calcStats = (times) => {
        const sorted = times.sort((a, b) => a - b);
        return {
            avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
            min: Math.min(...times),
            max: Math.max(...times),
            median: sorted[Math.floor(sorted.length / 2)]
        };
    };

    const currentStats = calcStats(results.current.times);
    const optimizedStats = calcStats(results.optimized.times);

    // Display results
    console.log(`\n${colors.cyan}===========================================`);
    console.log(`📈 RESULTS`);
    console.log(`===========================================\n${colors.reset}`);

    console.log(`${colors.green}Current Implementation (/api/courses/search):${colors.reset}`);
    console.log(`  Avg Response Time: ${currentStats.avg}ms`);
    console.log(`  Min: ${currentStats.min}ms | Max: ${currentStats.max}ms | Median: ${currentStats.median}ms`);
    console.log(`  Cache Hits: ${results.current.cacheHits} | Misses: ${results.current.cacheMisses}`);
    console.log(`  Hit Rate: ${((results.current.cacheHits / (results.current.cacheHits + results.current.cacheMisses)) * 100).toFixed(1)}%\n`);

    console.log(`${colors.yellow}Optimized Implementation (/api/courses-v2/search):${colors.reset}`);
    console.log(`  Avg Response Time: ${optimizedStats.avg}ms`);
    console.log(`  Min: ${optimizedStats.min}ms | Max: ${optimizedStats.max}ms | Median: ${optimizedStats.median}ms`);
    console.log(`  Cache Hits: ${results.optimized.cacheHits} | Misses: ${results.optimized.cacheMisses}`);
    console.log(`  Hit Rate: ${((results.optimized.cacheHits / (results.optimized.cacheHits + results.optimized.cacheMisses)) * 100).toFixed(1)}%\n`);

    // Calculate improvement
    const improvement = ((currentStats.avg - optimizedStats.avg) / currentStats.avg * 100).toFixed(1);
    const winner = optimizedStats.avg < currentStats.avg ? 'OPTIMIZED' : 'CURRENT';

    console.log(`${colors.cyan}===========================================`);
    console.log(`🏆 Winner: ${winner}`);
    console.log(`⚡ Performance Difference: ${Math.abs(improvement)}% ${improvement > 0 ? 'faster' : 'slower'}`);
    console.log(`===========================================\n${colors.reset}`);

    // Recommendation
    if (optimizedStats.avg < currentStats.avg && Math.abs(improvement) > 15) {
        console.log(`${colors.green}✅ RECOMMENDATION: Use optimized version (${Math.abs(improvement)}% faster)${colors.reset}\n`);
    } else if (optimizedStats.avg < currentStats.avg) {
        console.log(`${colors.yellow}⚠️  RECOMMENDATION: Minor improvement (${Math.abs(improvement)}%), consider code quality${colors.reset}\n`);
    } else {
        console.log(`${colors.red}❌ RECOMMENDATION: Keep current version (no performance gain)${colors.reset}\n`);
    }
}

// Run the benchmark
runBenchmark().catch(console.error);
