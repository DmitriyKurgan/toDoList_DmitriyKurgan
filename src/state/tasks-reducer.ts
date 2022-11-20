import {AddTodolistType, RemoveTodolistType, SetTodolistsACType} from './todolists-reducer';
import {TasksStateType} from '../AppWithRedux';
import {TaskPriorities, TaskStatuses, TaskType, todolistAPI, UpdatedTaskType} from '../api/api';
import {AppThunk} from './store';


export type RemoveTaskACType = ReturnType<typeof removeTaskAC>
export type AddTaskACType = ReturnType<typeof addTaskAC>
export type UpdateTaskACType = ReturnType<typeof updateTaskAC>
export type SetTasksACType = ReturnType<typeof setTasksAC>
export type CzarType =
    RemoveTaskACType
    | AddTaskACType
    | UpdateTaskACType
    | AddTodolistType
    | RemoveTodolistType
    | SetTodolistsACType
    | SetTasksACType

type UpdateTaskModelDomainType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}

let initialState: TasksStateType = {}


export const tasksReducer = (state: TasksStateType = initialState, action: CzarType) => {
    switch (action.type) {
        case 'REMOVE-TASK': {
            return {...state, [action.payload.todolistId]: state[action.payload.todolistId].filter(t => t.id !== action.payload.taskID)
            }
        }
        case 'ADD-TASK': {
            return {...state, [action.payload.todolistId]: [action.payload.task,...state[action.payload.todolistId]]}
        }
        case 'UPDATE-TASK': {
            return {
                ...state,
                [action.payload.todolistId]: state[action.payload.todolistId].map(t => t.id === action.payload.taskID ? {
                    ...t, ...action.payload.model} : t)
            }
        }
        case 'ADD-TODOLIST': {
            return {...state, [action.payload.todolistId]: []}
        }
        case 'REMOVE-TODOLIST': {
            const {[action.payload.todolistId]: [], ...restTasks} = {...state} //через деструктуризацию
            return restTasks
        }
        case 'SET-TODOLISTS': {
            let stateCopy = {...state};
                action.payload.todolists.forEach( tl =>{
                    stateCopy[tl.id] = []
                })
            return stateCopy;
        }
        case 'SET-TASKS':{
            return {...state, [action.payload.todolistId]:action.payload.tasks}
        }
        default:
            return state
    }
}

export const removeTaskAC = (todolistId: string, taskID: string) => {
    return {
        type: 'REMOVE-TASK',
        payload: {
            todolistId,
            taskID
        }
    } as const
}


export const addTaskAC = (todolistId: string, task: TaskType) => {
    return {
        type: 'ADD-TASK',
        payload: {
            todolistId,
            task
        }
    } as const
}



export const updateTaskAC = (todolistId: string, taskID: string, model: UpdateTaskModelDomainType) => {
        return {
        type: 'UPDATE-TASK',
        payload: {
            todolistId,
            taskID,
            model
        }
    } as const
}

export const setTasksAC = (todolistId: string, tasks:TaskType[]) => {
    return {
        type: 'SET-TASKS',
        payload: {
            todolistId,
            tasks
        }
    } as const
}

export const requestedTasksTC = (todlistID:string):AppThunk => (dispatch,getState) =>{
    todolistAPI.getTasks(todlistID)
        .then(res => dispatch(setTasksAC(todlistID, res.data.items)))
}

export const addTaskTC = (todolistID:string, taskTitle:string):AppThunk =>(dispatch, getState, extraArgument) =>{
    todolistAPI.createTask(todolistID, taskTitle)
        .then(res => dispatch(addTaskAC(todolistID,res.data.data.item)))
}

export const deleteTaskTC = (todolistID:string, taskID:string):AppThunk =>(dispatch, getState, extraArgument) =>{
    todolistAPI.deleteTask(todolistID, taskID)
        .then(res => dispatch(removeTaskAC(todolistID,taskID)))
}
//обновляем поля Таски, передавая обьект домейн модел со всеми необязательными свойствами, здесь будут поля статус и тайтл
export const updateTaskTC = (todolistID:string, taskID:string, domainModel:UpdateTaskModelDomainType):AppThunk =>(dispatch, getState, extraArgument) =>{
    let task = getState().tasks[todolistID].find(t => t.id ===taskID);
    if (!task){
        throw new Error ('Task is not found in state');
        return;
    }
    //создаем объект, в который полностью копируем поля таски из текущего стейта и перезаписываем нашим доменым объектом нужное свойство
    const apiModel:UpdatedTaskType = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        startDate: task.startDate,
        deadline: task.deadline,
        ...domainModel
    }
    todolistAPI.updateTask(todolistID,taskID,apiModel)
        .then(res =>{
            dispatch(updateTaskAC(todolistID,taskID,domainModel))
        })
}