/*
 * Line follower for R4M National - Indonesia
 * Used PID Algorithm, reference: https://robotresearchlab.com/2019/02/16/pid-line-follower-tuning/
 * by rens
 * 
 * Pins:
 * +-----------------+
 * | [ ] [ ] [ ] BTN | Button
 * | [ ] [ ] MTL MTR | Motors
 * +-----------------+
 * | . L R . . . . . | Sensors
 * +-----------------+
 */

// 0-255
const Motor = {
    // 0-255
    MAX_SPEED: 200,
    // 0-255
    BASE_SPEED: 80,
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

const ForceSensor = {
    MAIN: DigitalPin.P20,

    isPressed: (forceSensor: DigitalPin = null) =>
        pins.digitalReadPin(forceSensor == null ? ForceSensor.MAIN : forceSensor) == 0
}

function showIcon(icon: IconNames, duration = 0) {
    basic.showIcon(icon, 0);
    basic.pause(duration);
}

function pauseAnimation(duration: number) {
    const startTime = input.runningTime();
    led.plotAll();

    let lastProgress = 0;

    while (input.runningTime() < startTime + duration) {
        if (ForceSensor.isPressed())
            return 1;

        const elapsed = Math.max(0, input.runningTime() - startTime);
        const progress = Math.round(elapsed / duration * 25);

        if (progress > lastProgress) {
            for (let i = lastProgress; i < progress; i++) {
                const x = i % 5;
                const y = Math.floor(i / 5);
                led.unplot(x, y);
            }
            lastProgress = progress;
        }
    }
    return 0;
}

function main() {
    // go forwards for a duration
    basic.showArrow(ArrowNames.North, 0);
    Motor.set(Motor.LEFT, 0, Motor.MAX_SPEED);
    Motor.set(Motor.RIGHT, 1, Motor.MAX_SPEED);
    basic.pause(1000);

    // wait for other robots
    Motor.set(Motor.LEFT, 0, 0);
    Motor.set(Motor.RIGHT, 1, 0);
    if (pauseAnimation(25 * 1000) == 1)
        showIcon(IconNames.Surprised, 500);
    else
        showIcon(IconNames.Surprised);

    // const [Kp, Ki, Kd] = [Motor.MAX_SPEED * 0.9, 0.02, 0.05];
    const Kp = Motor.BASE_SPEED * 1;
    const Ki = 0;
    const Kd = 0.75;
    let [P, I, D, lastError] = [0, 0, 0, 0];

    while (!ForceSensor.isPressed()) {
        const leftOnLine = Sensor.isOnLine(Sensor.LEFT);
        const rightOnLine = Sensor.isOnLine(Sensor.RIGHT);

        if (leftOnLine) led.plot(0, 0); else led.unplot(0, 0);
        if (rightOnLine) led.plot(4, 0); else led.unplot(4, 0);

        /* PID ALGORITHM */
        let error = 0;
        if (leftOnLine && !rightOnLine) { // drifting right
            error = 1;
        } else if (!leftOnLine && rightOnLine) { // drifting left
            error = -1;
        } else if (leftOnLine && rightOnLine) {
            // terminate
            Motor.set(Motor.LEFT, 0, 50);
            Motor.set(Motor.RIGHT, 1, 50);
            showIcon(IconNames.No, 150);
            break;
        }

        P = error;
        I = I + error;
        D = error - lastError;
        lastError = error;

        const correction = (Kp * P) + (Ki * I) + (Kd * D);

        Motor.set(Motor.LEFT, 0, Motor.BASE_SPEED - correction);
        Motor.set(Motor.RIGHT, 1, Motor.BASE_SPEED + correction);

    }
}

while (true) {
    // Reset motors
    Motor.set(Motor.LEFT, 0, 0);
    Motor.set(Motor.RIGHT, 1, 0);
    showIcon(IconNames.Asleep, 1000);

    while (!ForceSensor.isPressed()) { } // wait for button press

    main();
}
