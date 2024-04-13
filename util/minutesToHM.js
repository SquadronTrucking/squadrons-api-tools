function minutesToHHMM(mins) {
    // Subtract 24 hours if totalMinutes exceeds 24 hours
    if (mins >= 1440) {
        mins = Number(mins) - Number(1440); //minus 24 hour 
        console.log(mins, 'more 24 hour');
    }

    //remove anything in decimals

    mins = Math.trunc(mins)

    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h; // (or alternatively) h = String(h).padStart(2, '0')
    m = m < 10 ? '0' + m : m; // (or alternatively) m = String(m).padStart(2, '0')
    return `${h}:${m}`;
}
 

module.exports = { minutesToHHMM }
