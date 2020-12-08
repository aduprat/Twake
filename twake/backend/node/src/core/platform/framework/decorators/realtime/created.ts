import { getPath, RealtimePath } from "..";
import { CreateResult } from "../../api/crud-service";
import { RealtimeEntityEvent, RealtimeEntityActionType } from "../../../services/realtime/types";
import { eventBus } from "../../../services/realtime/bus";
import { getRoom, PathResolver } from ".";

/**
 *
 * @param path the path to push the notification to
 * @param resourcePath the path of the resource itself
 */
export function RealtimeCreated<T>(
  room: RealtimePath<T>,
  resourcePath?: string | PathResolver<T>,
): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const result: CreateResult<T> = await originalMethod.apply(this, args);
      // context should always be the last arg
      const context = args && args[args.length - 1];

      if (!(result instanceof CreateResult)) {
        return result;
      }

      eventBus.publish<T>(RealtimeEntityActionType.Created, {
        type: result.type,
        room: getRoom(room, result, context),
        resourcePath: getPath(resourcePath, result, context),
        entity: result.entity,
        result,
      } as RealtimeEntityEvent<T>);

      return result;
    };
  };
}