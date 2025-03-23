function waitToStart() {
    basic.showIcon(IconNames.Asleep);

    // Reset motors
    Motor.set(Motor.LEFT, 0, 0);
    Motor.set(Motor.RIGHT, 1, 0);
    while (pins.digitalReadPin(DigitalPin.P20) != 0) {

    }
    main()
}
function main() {
    basic.showIcon(IconNames.Surprised)
    // Motor.set(Motor.LEFT, 0, 100)
    // Motor.set(Motor.RIGHT, 0, 100)
    // while (true) {
    //     const l = pins.digitalReadPin(DigitalPin.P8) == 1;
    //     const r = pins.digitalReadPin(DigitalPin.P12) == 1;
    //     if (l) led.plot(0,0); else led.unplot(0,0);
    //     if (r) led.plot(4,0); else led.unplot(4,0);

    // }
    // main loop

    //@ts-ignore
    const [Kp, Ki, Kd] = [60, 0.2, 30] as const;
    let [sumError, lastError] = [0, 0];

    while (pins.digitalReadPin(DigitalPin.P20) != 0) {
        const leftOnLine = Sensor.isOnLine(Sensor.LEFT);
        const rightOnLine = Sensor.isOnLine(Sensor.RIGHT);

        /* BANG BANG ALGORITHM */
        // if (!leftOnLine && !rightOnLine) {
        //     Motor.set(Motor.LEFT, 0, Motor.MAX_SPEED);
        //     Motor.set(Motor.RIGHT, 1, Motor.MAX_SPEED);
        // }
        // if (!leftOnLine && rightOnLine) {
        //     Motor.set(Motor.LEFT, 0, Motor.MAX_SPEED);
        //     Motor.set(Motor.RIGHT, 1, 0);
        // }
        // if (leftOnLine && !rightOnLine) {
        //     Motor.set(Motor.LEFT, 0, 0);
        //     Motor.set(Motor.RIGHT, 1, Motor.MAX_SPEED);
        // }

        /* PID ALGORITHM */
        let error = 0;
        if (leftOnLine && !rightOnLine) {
            error = -1;
        } else if (!leftOnLine && rightOnLine) {
            error = -1;
        } else if (leftOnLine && rightOnLine) {
            break;
        }

        const p = Kp * error;
        sumError += error;
        const i = Ki * sumError;
        const d = Kd * (error - lastError);

        const correction = p + i + d;

        Motor.set(Motor.LEFT, 0, Motor.MAX_SPEED - correction);
        Motor.set(Motor.RIGHT, 0, Motor.MAX_SPEED + correction);

        lastError = error;
    }
    waitToStart();
}
// 0-255
const Motor = {
    // 0-255
    MAX_SPEED: 75,
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

waitToStart()
