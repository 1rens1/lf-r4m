input.onButtonPressed(Button.A, function () {
    sensors.DDMmotor(
    AnalogPin.P1,
    0,
    AnalogPin.P8,
    100
    )
    led.toggle(0, 0)
})
