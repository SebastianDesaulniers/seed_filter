const NATURES = { "hardy": 0, "lonely": 1, "brave": 2, "adamant": 3, "naughty": 4, "bold": 5, "docile": 6, "relaxed": 7, "impish": 8, "lax": 9, "timid": 10, "hasty": 11, "serious": 12, "jolly": 13, "naive": 14, "modest": 15, "mild": 16, "quiet": 17, "bashful": 18, "rash": 19, "calm": 20, "gentle": 21, "sassy": 22, "careful": 23, "quirky": 24 }
const INV_NATURES = ["hardy", "lonely", "brave", "adamant", "naughty", "bold", "docile", "relaxed", "impish", "lax", "timid", "hasty", "serious", "jolly", "naive", "modest", "mild", "quiet", "bashful", "rash", "calm", "gentle", "sassy", "careful", "quirky"]
const BW_VALID_DATES = {
    4: [5, 6, 7, 8, 11, 12, 15, 16, 17, 18, 21, 22, 23, 25, 26, 27, 28, 29],
    8: [3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 20, 21, 22, 25, 26, 27, 28, 31],
    12: [4, 5, 6, 7, 10, 11, 15, 16, 17, 19, 20, 21, 25, 26, 27, 28, 31]

}
const probabilityTable = [
    [50, 100, 100, 100, 100],
    [50, 50, 100, 100, 100],
    [30, 50, 100, 100, 100],
    [25, 30, 50, 100, 100],
    [20, 25, 33, 50, 100],
    [100, 100, 100, 100, 100]];

function range(start, end) { return [...Array(1 + end - start).keys()].map(v => start + v) } // thanks SO (https://stackoverflow.com/questions/36947847/how-to-generate-range-of-numbers-from-0-to-n-in-es2015-only)
const ENCOUNTER_SLOTS = { 0: range(0, 19), 1: range(20, 39), 2: range(40, 49), 3: range(50, 59), 4: range(60, 69), 5: range(70, 79), 6: range(80, 84), 7: range(85, 89), 8: range(90, 93), 9: range(94, 97), 10: [98], 11: [99] }

class Seed {
    constructor(seed, stepcount) {
        seed = BigInt(seed)

        this.initialSeed = seed
        this.current = seed
        this.currentFrame = 0

        this.frames = new Array(5000)
        this.frames[0] = this.initialSeed

        this.stepcount = stepcount
    }
    calc(rounds) {
        let count = 0
        for (let i = 0; i < rounds; i++) {
            for (let k = 0; k < 6; k++) {
                for (let j = 0; j < 5; j++) {
                    if (probabilityTable[k][j] == 100) {
                        break;
                    }

                    count++;
                    this.advance(1)
                    var rng = Number(((this.current >> 32n) * 101n) >> 32n);

                    if (rng <= probabilityTable[k][j]) {
                        break;
                    }

                }

            }
        }
        return count

    }
    calcStarterFrame() {
        this.calc(2) // initial pidrng calculation, up to new game
        this.calc(1) // iv rng transition
        this.advance(2) // juniper says hello
        this.advance(2) // naming & "creating save data"
        this.calc(4) // transition from intro to cutscene
        this.advance(14) // static advancement, white screen in house
    }


    step() {
        this.stepcount++
        this.advance(2)
        if (this.stepcount > 127) {
            this.advance(1)
            this.stepcount = 0
        }
        if (this.stepcount % 20 == 0) {
            this.advance(1)
        }
    }

    high16() {
        return this.current >> 48n;
    }

    low16() {
        return (this.current >> 32n) & 0xFFFFn;
    }

    advance(n) {
        for (var i = 0; i < n; i++) {
            this.current = ((this.current * 0x5D588B656C078965n) & 0xFFFFFFFFFFFFFFFFn) + 0x269EC3n
            this.frames[++this.currentFrame] = this.current
        }
    }

    next(n) {
        let temp = this.current
        for (var i = 0; i < n; i++) {
            temp = ((temp * 0x5D588B656C078965n) & 0xFFFFFFFFFFFFFFFFn) + 0x269EC3n
        }
        return temp;
    }

    getPID() {
        let l = this.low16().toString(16)
        return BigInt("0x" + this.high16().toString(16) + "" + l);
    }

    getAbility() {
        return Number(~(this.getPID() >> 16n) & 1n)
    }

    getNature() {
        let res = this.next(1)
        return Number(((res >> 32n) * 25n) >> 32n)
    }

    getEncounterSlot(n) { // Forgive me, wartab 
        var res = Number((this.frames[n] >> 48n) / 656n)
        for (var i = 0; i <= 11; i++) {
            if (ENCOUNTER_SLOTS[i].includes(res))
                return i;
        }
    }

    canSpawnCloud() {
        let res = this.next(1)
        return (res >> 60n) == 0n && BigInt(this.stepcount) % 20n == 0n
    }

    hasDustCloudEncounter() {
        let res = (((this.current >> 32n) * 1000n) >> 32n)
        return res <= 400n
    }

    hasEncounter(n) {
        return (this.frames[n] >> 48n) / 656n <= 8n
    }

}

function parseText(id, key, func, def) {
    let res = document.getElementById(id).value.split(key)
    if (func != undefined)
        res = res.map(x => func(x))

    if (res.includes("-1") || res.includes(-1)) return def;
    return res;
}


function filter() {
    document.getElementById("output").value = ""

    var natures = parseText("natures", " ", undefined, "adamant bashful bold brave calm careful docile gentle hardy hasty impish jolly lax lonely mild modest naive naughty quiet quirky rash relaxed sassy serious timid".split(" "))
    for (var i = 0; i < natures.length; i++) {
        natures[i] = NATURES[natures[i].toLowerCase()]
    }

    var slots = parseText("slots", " ", parseInt, range(0, 11))
    var abilities = parseText("abilities", " ", parseInt, [0, 1])
    var genders = parseText("genders", " ", parseInt, [0, 1, 2])

    var frames = parseText("frames", "/", parseInt, [30, 300])
    var minFrame = frames[0], maxFrame = frames[1]

    var bw1 = parseText("bw1", "", x => x.toLowerCase() == "y", "y")[0]
    var starter = parseText("starter", "", x => x.toLowerCase() == "y", "y")[0]
    var dustCloud = parseText("dustCloud", "", x => x.toLowerCase() == "y", "y")[0]
    var hasDustCloud = false


    var months = parseText("months", " ", parseInt, range(1, 12))
    var days = parseText("days", " ", parseInt, range(1, 31))

    var hours = parseText("hours", " ", parseInt, range(0, 23))
    var minutes = parseText("minutes", " ", parseInt, range(0, 59))
    var seconds = parseText("seconds", " ", parseInt, range(0, 59))

    var rawData = document.getElementById("input").value.split("\n")

    for (var i = 0; i < rawData.length; i++) {
        if (rawData[i].length <= 7 || rawData[i][0] == "S") continue

        var data = rawData[i].slice(0, 16);
//        var dates = data[10].split('/'), month = parseInt(dates[0]), day = parseInt(dates[1]), year = parseInt(dates[2].split(' ')[0])
//        var times = ((data[10].split(' ')).join(':')).split(':'), hour = parseInt(times[1]), minute = parseInt(times[2]), second = parseInt(times[3])

 //       if (bw1 && !BW_VALID_DATES[month].includes(day))
     //       continue
//        if (!months.includes(month) || !days.includes(day) || !hours.includes(hour) || !seconds.includes(second) || !minutes.includes(minute))
//            continue;

        hasDustCloud = false

        var seed = new Seed("0x" + data, 90)
        var extraSteps = 0, encounterFrame = 0, extraAdvances = 0

        if (starter)
            seed.calcStarterFrame();
        else
            seed.calc(5)

        for (var j = seed.currentFrame; j <= maxFrame; j++) {
            if (dustCloud && seed.currentFrame <= maxFrame) {
                if (hasDustCloud) {
                    if (seed.hasDustCloudEncounter() && abilities.includes(seed.getAbility()) && natures.includes(seed.getNature()) && slots.includes(seed.getEncounterSlot(seed.currentFrame - 2))) {
                        document.getElementById("output").value += INV_NATURES[seed.getNature()] + " ADVANCES: " + (seed.currentFrame - encounterFrame + 3) + " FRAME: " + Number(encounterFrame) + " " + rawData[i] + "\n" // Forgive me, wartab x2
                        break;
                    }
                    else {
                        seed.advance(2)
                        extraAdvances++
                    }

                }
                else {
                    seed.step()
                    if (seed.canSpawnCloud()) {
                        hasDustCloud = true
                        encounterFrame = seed.currentFrame
                    }
                }
            }
            else if (starter) {
                if (natures.includes(Number(seed.getNature()))) {
                    document.getElementById("output").value += INV_NATURES[seed.getNature()] + " FRAME: " + Number(seed.currentFrame) + " " + rawData[i] + "\n" // Forgive me, wartab x2
                }
                break;
            }
            else {
                if (seed.hasEncounter(seed.currentFrame - 3)) {
                    if (abilities.includes(Number(seed.getAbility())) && natures.includes(Number(seed.getNature())) && slots.includes(Number(seed.getEncounterSlot(seed.currentFrame - 2)))) {
                        document.getElementById("output").value += INV_NATURES[seed.getNature()] + " FRAME: " + Number(seed.currentFrame) + " " + rawData[i] + "\n" // Forgive me, wartab x2
                        break;
                    }
                }
                seed.advance(1)
            }
        }
    }

}
