import { TargetStateString } from '../../enums/target.enum';
import { Target } from '../../store/slices/targetsSlice';
import { ImageButtonGhost } from '../ui/IconButton';
import { RedRoundButton } from '../ui/RedRoundButton';
import SpinnerMustard from '../ui/SpinnerMustard';

interface TargetCardExpandedProps {
  target: Target;
  onAction: (targetId: string) => void;
  onCenter: (targetId: string) => void;
  onAbort: (targetId: string) => void;
}

export function TargetCardExpanded({ target, onAction, onCenter, onAbort }: TargetCardExpandedProps) {

  const getStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'allocated':
        return 'בהמתנה';
      case 'designated':
        return 'מוקצה';
      case 'track':
        return 'נעול';
      case 'arm':
        return 'תקיפה';
      case 'Abort':
        return 'בוטל';
      case 'Destroyed':
        return 'הושמד';
      default:
        return '';
    }
  };

  const getType = (type: string) => {
    switch (type) {
      case 'droneMedium':
        return 'רחפן בנוני';
      case 'droneLarge':
        return 'רחפן גדול';
      case 'airplaneLarge':
        return 'מטוס גדול';
      case 'airplaneMedium':
        return 'מטוס בנוני';
      default:
        return '';
    }
  };
  const getTargetIcon = (type: string) => {
    return `${type}.svg`
  };

  return (
    <>
      {target !== undefined ?
        <div className={`p-4 shadow-md text-white bg-[#1f2937d6] m-[2px] mr-1 min-h-[150px] rounded-xl ${target && target.status !== TargetStateString.active ? 'border-4 border-yellow-400' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className='flex flex-col'>
                <div
                  className={
                    "inline-flex items-center justify-center w-12 h-12 p-2 rounded-full mt-0 mb-2 " +
                    (target.status === TargetStateString.track ||
                      target.status === TargetStateString.designated ||
                      target.status === TargetStateString.arm
                      ? "border-2 border-red-600"
                      : "border-0")
                  }
                >
                  <img
                    onClick={() => onCenter(target.id)}
                    src={`icons/targets/${getTargetIcon(target.type)}`}
                    alt={target.type}
                    className="w-8 h-8 object-contain block"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/icons/default_unknown_red.png';
                    }}
                  />
                </div>
                <div className='flex '>
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">
                      Az {Math.floor(Number(target.heading ?? 0))} °
                    </div>
                    <div className="text-sm text-gray-400">
                      {Number(target.speed ?? 0).toFixed(1)} kts
                    </div>
                  </div>
                  <div className="w-px h-10 ml-2 bg-[#9ca3af]" />
                </div>
              </div>

              <div className="flex-1">
                <div className="font-bold text-lg">{target.id}</div>
                <div className="font-bold text-xl text-yellow-400"> {getType(target.type)}</div>
                <div className="text-sm text-gray-400">
                  {target.speed} m
                </div>
                <div className="text-sm text-gray-400">
                  {target.coordinates.alt} kts
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">

              <div className="font-bold text-lg w-full text-center pb-2">{getStatus(target.status)}</div>
              {target.status === "active" &&
                <div>
                  <ImageButtonGhost onClick={() => onAction(target.id)} size={55} src='/icons/targets/Target_Point.png' />
                  <div className="font-bold text-[#98a5db] w-full text-center"> הקצה</div>
                </div>
              }
              {target.status === "designated" &&
                <div>
                  <RedRoundButton onClick={() => onAbort(target.id)} size={65} label='ביטול' />

                </div>

              }
              {(target.status === "track" || target.status === "arm" || target.status === "allocated") &&
                <div>
                  <RedRoundButton onClick={() => onAbort(target.id)} size={65} label='ביטול' />

                </div>

              }
              {target.status === "destroyed" &&
                <div>
                  <ImageButtonGhost size={50} src='/icons/targets/x.png' />
                  <div className="font-bold text-[#98a5db] w-full text-center"> הושמד</div>
                </div>
              }
              {target.status === "allocated" &&
                <div>
                  <SpinnerMustard size={60} stroke={6} />
                  <div className="font-bold text-[#98a5db] w-full text-center"> בהמתנה</div>
                </div>
              }
            </div>
          </div>
        </div >
        :
        ''
      }
    </>
  );
} 