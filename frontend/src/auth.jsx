import {createContext,useContext,useState,useEffect} from "react";
import {api,clearSession,acceptSession,refreshSession} from "./api";
const AuthContext=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null);const [ready,setReady]=useState(false);
 useEffect(()=>{let live=true;clearSession();refreshSession().then(u=>{if(live)setUser(u);}).catch(()=>{}).finally(()=>{if(live)setReady(true);});return()=>{live=false;};},[]);
 async function login(username,password,rememberMe){const data=await api("/api/auth/login",{method:"POST",body:{username,password,rememberMe}});setUser(acceptSession(data));}
 async function logout({revoke=true}={}){try{if(revoke)await api("/api/me/logout",{method:"POST"});}catch{sessionStorage.setItem("flash","Server revocation could not be confirmed.");}finally{try{await api("/api/auth/session/logout",{method:"POST"});}catch{}clearSession();setUser(null);window.location.replace("/login");}}
 return <AuthContext.Provider value={{user,login,logout}}>{ready?children:<div role="status" className="p-4">Loading session…</div>}</AuthContext.Provider>;
}
export function useAuth(){return useContext(AuthContext);}
