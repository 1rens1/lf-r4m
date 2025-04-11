/**
 * Line follower for R4M National - Indonesia
 * Used PID Algorithm, reference: https://robotresearchlab.com/2019/02/16/pid-line-follower-tuning/
 * by Rein
 */


function showIcon(icon: IconNames, duration = 0) {
    basic.showIcon(icon, 0);
    basic.pause(duration);
}

function pauseAnimation(duration: number) {
    const startTime = input.runningTime();
    basic.clearScreen();

    let lastProgress = 0;

    while (input.runningTime() < startTime + duration) {
        if (pins.digitalReadPin(DigitalPin.P20) == 0)
            return 1;

        const elapsed = Math.max(0, input.runningTime() - startTime);
        const progress = Math.round(elapsed / duration * 25);

        if (progress > lastProgress) {
            for (let i = lastProgress; i < progress; i++) {
                const x = i % 5;
                const y = Math.floor(i / 5);
                led.plot(x, y);
            }
            lastProgress = progress;
        }
    }
    return 0;
}

function main() {
    // go forwards for a duration
    basic.showArrow(ArrowNames.North);
    Motor.set(Motor.LEFT, 0, Motor.MAX_SPEED);
    Motor.set(Motor.RIGHT, 1, Motor.MAX_SPEED);
    basic.pause(1000);
    // wait for other robots
    Motor.set(Motor.LEFT, 0, 0);
    Motor.set(Motor.RIGHT, 1, 0);
    if (pauseAnimation(15 * 1000) == 1)
        showIcon(IconNames.Surprised, 500);
    else
        showIcon(IconNames.Surprised);

    //@ts-ignore
    // const [Kp, Ki, Kd] = [Motor.MAX_SPEED * 1, 0.035, 0.06] as const;
    const [Kp, Ki, Kd] = [Motor.MAX_SPEED * 0.9, 0.02, 0.02] as const;
    let [sumError, lastError] = [0, 0];

    while (pins.digitalReadPin(DigitalPin.P20) != 0) {
        const leftOnLine = Sensor.isOnLine(Sensor.LEFT);
        const rightOnLine = Sensor.isOnLine(Sensor.RIGHT);

        if (leftOnLine) led.plot(0, 0); else led.unplot(0, 0)
        if (rightOnLine) led.plot(4, 0); else led.unplot(4, 0)

        /* PID ALGORITHM */
        let error = 0;
        if (leftOnLine && !rightOnLine) { // drifting right
            error = 1;
        } else if (!leftOnLine && rightOnLine) { // drifting left
            error = -1;
        } else if (leftOnLine && rightOnLine) {
            // terminate
            Motor.set(Motor.LEFT, 0, Motor.MAX_SPEED * 0.5);
            Motor.set(Motor.RIGHT, 1, Motor.MAX_SPEED * 0.5);
            showIcon(IconNames.No, 500);
            break;
        }

        const p = Kp * error;
        sumError += error;
        const i = Ki * sumError;
        const d = Kd * (error - lastError);

        const correction = p + i + d;

        Motor.set(Motor.LEFT, 0, Motor.MAX_SPEED - correction);
        Motor.set(Motor.RIGHT, 1, Motor.MAX_SPEED + correction);

        lastError = error;
    }
}
// 0-255
const Motor = {
    //@ts-ignore
    // 0-255
    MAX_SPEED: 75 as const,
    // [Control Pin, Speed Pin]
    LEFT: [AnalogPin.P13, AnalogPin.P14],
    RIGHT: [AnalogPin.P15, AnalogPin.P16],

    set: (motor: AnalogPin[], ctrl: number, speed: number) => {
        sensors.DDMmotor(motor[0], ctrl, motor[1], speed);
    }
}
const Sensor = {
    LEFT: DigitalPin.P8,
    RIGHT: DigitalPin.P12,

    isOnLine: (sensor: DigitalPin) => pins.digitalReadPin(sensor) == 1
}

while (true) {
    // Reset motors
    Motor.set(Motor.LEFT, 0, 0);
    Motor.set(Motor.RIGHT, 1, 0);
    showIcon(IconNames.Asleep, 1000);
    while (pins.digitalReadPin(DigitalPin.P20) != 0) {
        // do nothing
    }
    main();
}
