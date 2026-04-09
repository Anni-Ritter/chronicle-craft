import Github from "../assets/icon/github.svg";
import Discord from "../assets/icon/discord.svg";
import Telegram from "../assets/icon/telegram.svg";
import { InstallPwaButton } from './InstallPwaButton';
import { Stars } from "lucide-react";

export const Footer = () => {
    const year = new Date().getFullYear();
    return (
        <footer className="hidden lg:block text-[#C2A774] border-t border-[#C2A774] pt-12 pb-6 mt-20 text-[16px] font-lora">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-start w-full justify-between">
                <div className="max-sm:hidden">
                    <h4 className="text-[#C2A774] text-lg mb-3">Навигация</h4>
                    <ul className="space-y-2">
                        <li><a href="/chronicles" className="hover:text-[#C2A774] transition">Хроники</a></li>
                        <li><a href="/graph" className="hover:text-[#C2A774] transition">Связи</a></li>
                        <li><a href="/maps" className="hover:text-[#C2A774] transition">Карта</a></li>
                        <li><a href="/" className="hover:text-[#C2A774] transition">Персонажи</a></li>
                    </ul>
                </div>

                <div className="space-y-3 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] uppercase tracking-[0.18em] text-[#c7bc98]">
                        <span className="w-1 h-1 rounded-full bg-[#c2a774]" />
                        <span>о проекте</span>
                    </div>
                    <h4 className="text-[#e5d9a5] text-lg font-garamond">
                        ChronicleCraft
                    </h4>
                    <p className="opacity-80 leading-relaxed text-sm text-[#d6c5a2]">
                        Система визуализации персонажей, связей и хроник для фэнтези-историй,
                        кампаний и ролевых миров. Храните лор так же красиво, как его придумываете.
                    </p>
                </div>

                <div className="hidden max-sm:flex flex-row gap-6 w-full justify-center items-center">
                    <img src={Github} alt="GitHub" className="w-6 h-6 mb-3" />
                    <img src={Discord} alt="Discord" className="w-6 h-6 mb-3" />
                    <img src={Telegram} alt="Telegram" className="w-6 h-6 mb-3" />
                </div>

                <ul className="hidden max-sm:flex flex-row justify-between w-full px-3">
                    <li><a href="/chronicles" className="hover:text-[#C2A774] transition underline">Хроники</a></li>
                    <li><a href="/graph" className="hover:text-[#C2A774] transition underline">Связи</a></li>
                    <li><a href="/maps" className="hover:text-[#C2A774] transition underline">Карта</a></li>
                    <li><a href="/" className="hover:text-[#C2A774] transition underline">Персонажи</a></li>
                </ul>
                <div className="text-end max-sm:hidden">
                    <h4 className="text-[#C2A774] text-lg mb-3">Контакты</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-[#C2A774]">GitHub</a></li>
                        <li><a href="#" className="hover:text-[#C2A774]">Discord</a></li>
                        <li><a href="#" className="hover:text-[#C2A774]">Telegram</a></li>
                    </ul>
                </div>
            </div>
            <div className="w-full justify-center flex items-center">
                <InstallPwaButton />
            </div>
            <p className="text-center mt-12 text-xs opacity-40">
                © {year} ChronicleCraft. Сделано с магией <Stars className="inline-block" size={12} />
            </p>
        </footer>
    );
};