/**
 * HERMES QC Auto Runner
 * Called by Windows Task Scheduler at 9:30 AM every day
 * Runs full pipeline: read yesterday's reports → analyze → Excel → Gmail
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const hermesSkill = require('./skills/hermes_skill');

async function main() {
    console.log('='.repeat(60));
    console.log('HERMES QC Automation - Auto Runner');
    console.log(`Started: ${new Date().toLocaleString('en-GB')}`);
    console.log('='.repeat(60));

    const result = await hermesSkill.run(true);

    console.log('='.repeat(60));
    console.log(`STATUS: ${result.status.toUpperCase()}`);

    if (result.status === 'success') {
        const s = result.stats;
        console.log(`Reports: ${s.total} | PASS: ${s.pass} | HOLD: ${s.hold} | REJECT: ${s.reject}`);
        console.log(`Excel: ${result.excelPath}`);
        console.log(`Finished: ${new Date().toLocaleString('en-GB')}`);
        console.log('='.repeat(60));
        process.exit(0);
    } else if (result.status === 'no_files') {
        console.log(result.message);
        console.log('='.repeat(60));
        process.exit(1);
    } else if (result.status === 'error') {
        console.log(`Error: ${result.error}`);
        console.log('='.repeat(60));
        process.exit(2);
    } else {
        console.log('='.repeat(60));
        process.exit(99);
    }
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(99);
});
