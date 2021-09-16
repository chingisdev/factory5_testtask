// constants
const dataSample = [
    {"date": "2019-04-03T10:19:23.823Z", "id": 0, "type": "in"},
    {"date": "2019-04-03T22:15:23.823Z", "id": 0, "type": "out"},
    {"date": "2019-04-02T10:19:23.823Z", "id": 0, "type": "in"},
    {"date": "2019-04-02T22:15:23.823Z", "id": 0, "type": "out"},
    { "date": "2019-04-02T08:15:24.911Z", "id": 1, "type": "in" },
    { "date": "2019-04-02T15:20:24.911Z", "id": 1, "type": "out" },
    { "date": "2019-04-02T18:21:24.911Z", "id": 1, "type": "in" },
    { "date": "2019-04-02T08:15:37.733Z", "id": 2, "type": "in" },
    { "date": "2019-04-02T08:15:54.910Z", "id": 3, "type": "in" },
    { "date": "2019-04-02T08:15:23.823Z", "id": 4, "type": "out" },
    { "date": "2019-04-02T08:15:24.911Z", "id": 5, "type": "out" },
    { "date": "2019-04-02T08:15:37.733Z", "id": 6, "type": "out" },
    { "date": "2019-04-02T20:15:54.910Z", "id": 7, "type": "out" },
    { "date": "2019-04-02T08:15:54.910Z", "id": 7, "type": "in" }
];
const START_HOUR = 6;
const FINISH_HOUR = 23;

const makeEmployeeMap = (data, dateStart, dateEnd) => {
    const startTime = new Date(dateStart).getTime();
    const endTime = new Date(dateEnd).getTime();
    const employeeDataMap = new Map();
    for (let i = 0; i < data.length; i++) {
        const {id, type} = data[i];
        if (!employeeDataMap.get(id)) {
            employeeDataMap.set(id, []);
        }
        const date = new Date(data[i]?.date);
        const typeEdited = type === 'in';
        if (date.getTime() > startTime && date.getTime() < endTime) {
            employeeDataMap.get(id).push({date, type: typeEdited});
        }
    }
    return employeeDataMap;
}

const sortDateAscending = (map) => {
    for (const value of map.values()) {
        value.sort((firstItem, secondItem) => firstItem.date - secondItem.date);
    }
}

// -----------TIME SPEND ORIENTED FUNCTIONS----------------
const makeRecordingDateSample = (param, date) => {
    const mockDate = new Date();
    mockDate.setTime(date.getTime());
    if (param === 'start') {
        mockDate.setUTCHours(START_HOUR);
    } else if (param === 'finish') {
        mockDate.setUTCHours(FINISH_HOUR);
    }
    mockDate.setUTCMinutes(0);
    return mockDate;
}

// if out search last, if in search first
const findActualRecord = (userData, index) => {
    let step = 0;
    const type = userData[index].type;
    let currentIndex = index + 1;
    while (userData[currentIndex] && userData[currentIndex].type === type) {
        ++step;
        ++currentIndex;
    }
    const currentDate = type ? userData[index].date : userData[currentIndex - 1].date;
    return {currentDate, step};
}

const convertMillisToHours = (millis) => {
    const minutes = millis / 1000 / 60;
    return Math.round((minutes / 60) * 10) / 10;
}

const mockMapKeyDate = (date) => {
    return `${date.getUTCFullYear()} ${date.getUTCMonth()} ${date.getUTCDate()}`
}

const makeDailyRecordsMap = (userData) => {
    const map = new Map();
    const allDates = userData.map((data) => {
        const date = data.date;
        return mockMapKeyDate(date);
    });
    allDates.forEach((date) => {
        if (!map.get(date)) {
            map.set(date, [])
        }
    });
    userData.forEach((record) => {
        const time = record.date;
        const mockDate = mockMapKeyDate(time);
        map.get(mockDate).push(record);
    })
    return map;
}

const equalizeWithInvertType = (typeTrueCounter, typeFalseCounter, date) => {
    let mockDate;
    let result = 0;
    if (typeTrueCounter - typeFalseCounter === 1) {
        mockDate = makeRecordingDateSample('finish', date);
        result += mockDate.getTime();
    } else if (typeFalseCounter - typeTrueCounter === 1) {
        mockDate = makeRecordingDateSample('start', date);
        result -= mockDate.getTime();
    }
    return result;
}

const calculateTimeInDay = (array) => {
    let typeTrueCounter = 0;
    let typeFalseCounter = 0;
    let dayResult = 0;
    for (let i = 0; i < array.length; i++) {
        const {currentDate, step} = findActualRecord(array, i);
        i += step;
        array[i].type ? typeTrueCounter++ : typeFalseCounter++;
        const time = currentDate.getTime();
        dayResult += array[i].type ? (time * -1) : time;
    }
    return {dayResult, typeTrueCounter, typeFalseCounter}
}

const countTimeSpend = (userData) => {
    const dailyRecordsMap = makeDailyRecordsMap(userData);
    let result = 0;
    for (const array of dailyRecordsMap.values()) {
        const { dayResult, typeTrueCounter, typeFalseCounter } = calculateTimeInDay(array);
        result += dayResult;
        result += equalizeWithInvertType(typeTrueCounter, typeFalseCounter, array[0].date);
    }
    return convertMillisToHours(result);
}


// -------------CHECK FOR SUSPICIOUS DATA FUNCTIONS----------------
const hasBeenAtNight = (recordings) => {
    return recordings.some((record) => {
        const recordHour = record?.date.getUTCHours();
        return recordHour < START_HOUR || recordHour === FINISH_HOUR;
    });
}

const checkTypeOrder = (userRecordings) => {
    let flag = true;
    for (let i = 0; i < userRecordings.length; i++) {
        if (flag === userRecordings[i].type) {
            flag = !flag;
        } else {
            return false;
        }
    }
    return flag;
}

const checkForSuspiciousValue = (userRecordings) => {
    const hasRightOrder = checkTypeOrder(userRecordings);
    const beenAtNight = hasBeenAtNight(userRecordings);
    return !hasRightOrder || beenAtNight;
}


// --------------CONTROL FUNCTIONS DELEGATING OTHERS----------------
function makeFinalReport(employeeDataMap, dateStart, dateEnd) {
    const result = [];
    for (const [id, records] of employeeDataMap) {
        const entity = {};
        entity.id = id;
        entity.time = countTimeSpend(records);
        entity.hasSuspiciousValues = checkForSuspiciousValue(records);
        result.push(entity);
    }
    return result;
}

const buildVisitStatistics = (data, dateStart, dateEnd) => {
    const employeeMap = makeEmployeeMap(data, dateStart, dateEnd);
    sortDateAscending(employeeMap);
    return makeFinalReport(employeeMap, new Date(dateStart), new Date(dateEnd));
}

console.log(buildVisitStatistics(dataSample, '2019-04-01T06:00:00.823Z', '2019-04-04T23:00:00.823Z'));

