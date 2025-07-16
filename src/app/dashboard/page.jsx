import React from 'react'
import { CircleCheck, CircleMinus, CircleX } from 'lucide-react'

const Dashboard = () => {

    const schedule = [
        "Soft Skills",
        "Mathematics II",
        "Electronics",
        "Mechanics",
        "Chemistry Lab",
    ]

    const subjects = [
        "Soft Skills",
        "Mathematics II",
        "Mechanics",
        "Electronics",
        "Chemistry",
        "Electronics Lab",
        "Workshop",
        "Chemistry Lab"
    ]


    return (
        <>
            <div className="px-4 my-4">

                <div className="flex justify-between">
                    <p className="text-3xl font-semibold">Home</p>
                    <p className="text-xl bg-amber-300 px-3 py-1 rounded-full">A</p>
                </div>

                <div className="mt-6 scheduletoday">
                    <p className="text-xl font-semibold">Today's Schedule</p>

                    {/* <div className="bg-slate-200 w-full py-10 mt-3 rounded">

                        <p className=" text-center">No classes today, chill! </p>
                    </div> */}

                    {schedule.map((element, index) => (
                        <div key={index} className="w-full py-0.5 mt-1 rounded px-2">
                            <div className=" shadow-md flex justify-between px-6 py-4 rounded">
                                <div className="flex space-x-37">
                                    <CircleMinus size={30} />
                                    <p className="text-[20px] rounded font-[400]">{element}</p></div>
                                <div className="icons flex gap-2">
                                    <CircleCheck color="green" size={30} />
                                    <CircleX color="red" size={30} />

                                </div>
                            </div>
                        </div>
                    ))}




                </div>

                <div className="attendace">
                    <p className="mt-4 text-xl font-semibold">Attendance</p>

                    {subjects.map(
                        (element, index) => {
                            return (

                                <div className="flex justify-between mt-3" key={index}>
                                    <p className="">{element}</p>
                                    <p className="mr-4 bg-red-300 px-1.5 py-1.5 rounded-full">75%</p>
                                </div>

                            )
                        }
                    )}




                </div>
            </div>


        </>
    )
}

export default Dashboard