//----------------------------------------------------------------------------------------------------------
export class BaseController
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    error: string = null;
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    protected setError(error: string)
    //------------------------------------------------------------------------------------------------------
    {
        this.error = error;
    }
}