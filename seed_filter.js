var NATURES = { "hardy": 0, "lonely": 1, "brave": 2, "adamant": 3, "naughty": 4, "bold": 5, "docile": 6, "relaxed": 7, "impish": 8, "lax": 9, "timid": 10, "hasty": 11, "serious": 12, "jolly": 13, "naive": 14, "modest": 15, "mild": 16, "quiet": 17, "bashful": 18, "rash": 19, "calm": 20, "gentle": 21, "sassy": 22, "careful": 23, "quirky": 24 }
var NO_HAIL = {4: [5, 6, 7, 8, 11, 12, 15, 16, 17, 18, 21, 22, 23, 25, 26, 27, 28, 29],
              8: [3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 20, 21, 22, 25, 26, 27, 28, 31],
              12: [4, 5, 6, 7, 10, 11, 15, 16, 17, 19, 20, 21, 25, 26, 27, 28, 31]}
function range (start, end) { return [...Array(1+end-start).keys()].map(v => start+v) } // thanks SO (https://stackoverflow.com/questions/36947847/how-to-generate-range-of-numbers-from-0-to-n-in-es2015-only)
var SLOTS = {0: range(0, 19), 1: range(20, 39), 2: range(40,49), 3: range(50,59), 4: range(60,69), 5: range(70, 79), 6: range(80, 84), 7: range(85, 89),   8: range(90, 93), 9: range(94, 97), 10: [98], 11: [99]} 
    

class Seed {
    constructor(seed) {
        this.initial_seed = seed
        this.current = seed
        this.current_frame = 0
        this.frames = new Array(1000)
        this.frames[0] = this.initial_seed
    }

    high16() {
        return this.current >> 48n;
    }

    low16() {
        return (this.current >> 32n) & 0xFFFFn;
    }

    get_pid() {
        return BigInt(parseInt(this.high16().toString(16) + "" + this.low16().toString(16), 16))
    }

    advance(n) {
        for (var i = 0; i < n; i++) {
            this.current = ((this.current * 0x5D588B656C078965n) & 0xFFFFFFFFFFFFFFFFn) + 0x269EC3n;
            this.frames[++this.current_frame] = this.current
        }
    }
    get_nature() {
        var temp = ((this.current * 0x5D588B656C078965n) & 0xFFFFFFFFFFFFFFFFn) + 0x269EC3n; 
        return ((temp >> 32n)* 25n) >> 32n
    }

    is_encounter(n) {
        return (this.frames[n] >> 48n) / 656n <= 8n
    }
    slot(n) { // forgive me wartab 
        var res = Number((this.frames[n] >> 48n) / 656n)
        console.log(res)
        for (var i =0; i < 12; i++) {
            if (SLOTS[i].includes(res))
                return i;
        }
    }
}

function filter() {
    var natures = document.getElementById("natures").value.split(" ")
    document.getElementById("output").value = "";
    for (var i = 0; i < natures.length; i++) {
        natures[i] = NATURES[natures[i].toLowerCase()]
    }
    var slots = document.getElementById("slots").value.split(" ").map(x => parseInt(x))
    var abilities = document.getElementById("abilities").value.split(" ").map(x => parseInt(x))
    var genders = document.getElementById("genders").value.split(" ")

    var frames = document.getElementById("frames").value.split("/")
    var min_frame = parseInt(frames[0])
    var max_frame = parseInt(frames[1])

    var hail = document.getElementById("hail").value.toLowerCase() == "y"
    var months = document.getElementById("months").value.split(" ").map(x => parseInt(x))
    var hours = document.getElementById("hours").value.split(" ").map(x => parseInt(x))
    var seconds = document.getElementById("seconds").value.split(" ").map(x => parseInt(x))


    var raw_data = document.getElementById("input").value.split("\n")
    for (var i = 1; i < raw_data.length - 1; i++) {
        var data = raw_data[i].split('\t')

        var dates = data[10].split('/'), month=parseInt(dates[0]), day=parseInt(dates[1]), year=parseInt(dates[2].split(' ')[0])
        var times = ((data[10].split(' ')).join(':')).split(':'), hour=parseInt(times[1]), minute=parseInt(times[2]), second=parseInt(times[3])

        if (!hail && !NO_HAIL[month].includes(day))
            continue

        var seed = new Seed(BigInt("0x" + data[0]))
        seed.advance(min_frame)
        for (var j = min_frame;  j <= max_frame; j++) {
            if (abilities.includes(~(Number(seed.get_pid()) >> 16) & 1) && natures.includes(Number(seed.get_nature())) && seed.is_encounter(j - 3) && slots.includes(seed.slot(j - 2))){
                console.log(seed);
                document.getElementById("output").value += "PIDRNG FRAME: " + j + " " + raw_data[i] + "\n" // forgive me wartab
            }
            seed.advance(1)
        }
    }

}